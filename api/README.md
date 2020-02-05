# Auth gateway + dummy API + automatic TLS certificate renewal

## Structure

The service consists of 4 Docker containers.

- An unprotected REST API (`service`) with 2 datapoints - `/public` and `/protected`.
- A reverse proxy (`sidecar`) adding HTTPS, CORS policies, Authentication and optional Authorization to the unprotected API.
- A **Certbot** instance obtaining and renewing API certificates from Let's Encrypt.
- A **nginx** server used to pass Certbot's ACME challenge.

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

  - Generate a valid SSL certificate by:
    - Generating a dummy certificate with openssl *(to start nginx without errors)*
    - Starting nginx
    - Replacing the dummy certificate with a valid Let's Encrypt certificate
    - Reloading nginx

- Run `docker-compose up` to start the service and sidecar.

- **[OPTIONAL]** To run the service on startup, place the following line in `/etc/rc.local`

        (cd /root; docker-compose up)

## Configuration

API and Sidecar's endpoints are configured in `service/config.js` and `sidecar/config.js`.

SSO configuration for the Sidecar is configured in `sidecar/keycloak.json`.

### NOTE:

- Linux paths are case sensitive while domain names aren't. To avoid errors, always specify the domain name in lowercase when running `./init.sh`.
