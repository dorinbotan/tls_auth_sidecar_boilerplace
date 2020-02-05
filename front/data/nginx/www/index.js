'use strict'
const accessTokenViewer = new JSONViewer();
const refreshTokenViewer = new JSONViewer();
const idTokenViewer = new JSONViewer();

document.querySelector("#access_token").appendChild(accessTokenViewer.getContainer());
document.querySelector("#refresh_token").appendChild(refreshTokenViewer.getContainer());
document.querySelector("#id_token").appendChild(idTokenViewer.getContainer());

var keycloak = Keycloak();

keycloak.init({
    // flow: 'standard',
    onLoad: 'check-sso'
    // onLoad: 'login-required'
}).success(authenticated => {
    // console.log(authenticated ? 'authenticated' : 'not authenticated');
}).error(() => {
    // console.error('Failed to authenticate');
});

keycloak.onAuthSuccess = () => {
    accessTokenViewer.showJSON(keycloak.tokenParsed, 10, 10);
    refreshTokenViewer.showJSON(keycloak.refreshTokenParsed, 10, 10);
    idTokenViewer.showJSON(keycloak.idTokenParsed, 10, 10);
};

keycloak.onAuthError = errorData => {
    console.log("Auth Error: " + JSON.stringify(errorData) );
};

keycloak.onTokenExpired = () => {
    console.log('Access token expired.');
    
    keycloak.updateToken().success(refreshed => {
        if (!refreshed) {
            console.log('Token not refreshed, valid for ' + Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000) + ' seconds');
        }
    }).error(() => console.log('Failed to refresh token'));
};

keycloak.onAuthRefreshSuccess = () => {
    console.log('Auth Refresh Success');
    accessTokenViewer.showJSON(keycloak.tokenParsed, 10, 10);
    refreshTokenViewer.showJSON(keycloak.refreshTokenParsed, 10, 10);
    idTokenViewer.showJSON(keycloak.idTokenParsed, 10, 10);
};

keycloak.onAuthRefreshError = () => {
    console.log('Auth Refresh Error');
};

keycloak.onAuthLogout = () => {};

document.querySelector('#login_btn').onclick = keycloak.login;
document.querySelector('#logout_btn').onclick = keycloak.logout;
document.querySelector('#request_protected_btn').onclick = () => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.dorinbotan.com:5000/protected');
    xhr.setRequestHeader('Authorization', `Bearer ${keycloak.token}`);
    xhr.onload = () => {
        document.querySelector("#request_result").innerHTML = xhr.responseText;
        console.log(xhr.responseText);
    }
    xhr.send();
}
document.querySelector('#request_public_btn').onclick = () => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://api.dorinbotan.com:5000/public');
    xhr.onload = () => {
        document.querySelector("#request_result").innerHTML = xhr.responseText;
        console.log(xhr.responseText);
    }
    xhr.send();
}

setInterval(() => {
    if (keycloak.tokenParsed) {
        document.querySelector('#access_token_header').innerHTML = `Access token (valid for ${Math.round(keycloak.tokenParsed.exp + keycloak.timeSkew - new Date().getTime() / 1000)}sec):`;
    } else {
        document.querySelector('#access_token_header').innerHTML = `Access token:`;
    }

    document.querySelector('#request_result_container').style.margin = 'auto';
}, 1000);
