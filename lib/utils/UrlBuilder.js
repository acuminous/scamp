module.exports = class UrlBuilder {
  constructor(input = 'meh://') {
    this._url = new URL(input);
  }

  protocol(protocol) {
    this._url.protocol = protocol;
    return this;
  }

  hostname(hostname) {
    this._url.hostname = hostname;
    return this;
  }

  port(port) {
    this._url.port = port;
    return this;
  }

  username(username) {
    this._url.username = username;
    return this;
  }

  password(password) {
    this._url.password = password;
    return this;
  }

  pathname(pathname) {
    if (pathname === undefined) return this;
    this._url.pathname = pathname;
    return this;
  }

  query(params) {
    Object.entries(params).reduce((url, [key, value]) => {
      if (value === undefined) return url;
      url.searchParams.append(key, value);
      return url;
    }, this._url);
    return this;
  }

  hash(hash) {
    this._url.hash = hash;
    return this;
  }

  build() {
    return this._url;
  }

};