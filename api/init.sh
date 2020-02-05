#!/bin/bash
usage() {
  echo "Usage: $0 -r <yes|no> -d <string> -e <string>"  1>&2;
  echo "  -d VALUE      domain (ex. domain.com)"        1>&2;
  echo "  -e VALUE      email (ex. 12345@grundfos.com)" 1>&2;
  # echo "  -t VALUE      target"                         1>&2;
  # echo "  -p VALUE      target port"                    1>&2;
  echo "  -r yes|no     rewrite existing certificates"  1>&2;
  exit 1;
}

target=keycloak
target_port=8080

# while getopts ":d:e:r:p:t:" o; do
while getopts ":d:e:r:" o; do
  case "${o}" in
    r)
      rewrite=${OPTARG}
      ;;
    t)
      target=${OPTARG}
      ;;
    p)
      target_port=${OPTARG}
      ;;
    d)
      REGEX="(www\.)?(.*)"
      [[ ${OPTARG} =~ $REGEX ]]
      domain=${BASH_REMATCH[2]}
      ;;
    e)
      email=${OPTARG}
      ;;
    *)
      usage
      ;;
  esac
done

shift $((OPTIND-1))

if [ -z "${domain}" ] || [ -z "${email}" ]; then
  usage
fi

if [ -n "$rewrite" ] && [ "$rewrite" != "yes" ] && [ "$rewrite" != "no" ]; then
  usage
fi

echo "### Configuring NGINX as reverse proxy ..."
sed -e "s/\${DOMAIN_NAME}/$domain/g" -e "s/\${TARGET}/$target/g" -e "s/\${TARGET_PORT}/$target_port/g" ./data/nginx/conf/template > ./data/nginx/conf/app.conf

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

domains=($domain www.$domain)
rsa_key_size=4096
data_path="./data/certbot"
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

if [ -d "$data_path" ]; then
  if [ -n "$rewrite" ]; then
    if [ "$rewrite" == "no" ]; then
      exit
    fi
  else
    read -p "Existing data found for $domains. Continue and replace existing certificate? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
      exit
    fi
  fi
fi

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "### Creating dummy certificate for $domains ..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker-compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:1024 -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "### Starting nginx ..."
docker-compose up --force-recreate -d nginx
echo

echo "### Deleting dummy certificate for $domains ..."
docker-compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

echo "### Requesting Let's Encrypt certificate for $domains ..."
#Join $domains to -d args
domain_args=""
for d in "${domains[@]}"; do
  domain_args="$domain_args -d $d"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --non-interactive \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker-compose exec nginx nginx -s reload
