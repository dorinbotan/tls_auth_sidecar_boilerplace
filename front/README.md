#  static web client + nginx HTTPS server + automatic certificate renewal

## Structure

The service consists of 2 Docker containers.

- A **nginx** server serving static files over HTTPS. Static files are placed in `./data/nginx/www`. All HTTP requests are being redirected to HTTPS.
- A **Certbot** instance obtaining and renewing nginx certificates from Let's Encrypt.

## How to

- Run `config.sh` on the target system for initial docker configuration.

  This will:
  - Install Docker
  - Install docker-compose

- Run `init.sh -r <yes|no> -d <domain.com> -e <user@mail.com>` to configure nginx and Certbot.

  This will:
  - Create a **nginx** configuration file to:
    - Serve requests on `/.well-known/acme-challenge/*` port 80 *(required to pass Certbot validation)*
    - Redirect all other requests on port 80 to port 443 *(enforce HTTPS)*
    - Serve HTTPS requests on port 443

  - Generate a valid SSL certificate by:
    - Generating a dummy certificate with openssl *(to start nginx without errors)*
    - Starting nginx
    - Replacing the dummy certificate with a valid Let's Encrypt certificate
    - Reloading nginx

- Run `docker-compose up` to start the service.

- **[OPTIONAL]** To run the service on startup, place the following line in `/etc/rc.local`

        (cd /root; docker-compose up)

## Configuration

Paths to the API and SSO server, as well as SSO client configuration are hardcoded into the static (frontend) files.

### To change the SSO client configuration:

- Change the realm in `keycloak.json`.
- Change the resource (client) in `keycloak.json`.

### To change the path to the SSO server:

- Change the keycloak.js lib path in `index.html`.
- Change the auth-server-url lib path in `keycloak.json`.

### To change the path to the API server:

- Change the xhr request URLs in `index.js`.

### NOTE:

- Linux paths are case sensitive while domain names aren't. To avoid errors, always specify the domain name in lowercase when running `./init.sh`.
