const fs = require('fs');
const googleapis = require('googleapis');
const googleAuthLibrary = require('google-auth-library');

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata'
];
const drive_auth_token = 'drive_auth_token.json';
const drive_client_secret_json_filename = 'credentials.json';
let client_secret_data = null;
let oauth2Client = null;

let cdata = fs.readFileSync(drive_client_secret_json_filename, 'utf-8');
client_secret_data = JSON.parse(cdata);

const clientSecret = client_secret_data.installed.client_secret;
const clientId = client_secret_data.installed.client_id;
const redirectUrl = client_secret_data.installed.redirect_uris[0];
oauth2Client = new googleAuthLibrary.OAuth2Client(clientId, clientSecret, redirectUrl);

const upload_to_drive = async file_name => {
  try {
    var fileMetadata = {
      name: file_name,
      parents: ['1F_QPhuMnciFgJguXitxGk3gjic5eC6TO'] // your google drive folder id
    };
    var media = {
      mimeType: 'application/zip',
      body: fs.createReadStream(file_name)
    };

    let drive = googleapis.google.drive({ version: 'v3', auth: oauth2Client });
    let resData = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    console.log('File Id: ', resData.data);

    return resData;
  } catch (err) {
    throw err;
  }
};

const get_drive_details = async () => {
  try {
    let drive = googleapis.google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name)'
    });

    const files = response.data.files;
    if (files.length) {
      console.log('Files:');
      files.map(file => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  } catch (err) {
    throw err;
  }
};

const get_drive_auth_token_file = () => {
  try {
    let token = fs.readFileSync(drive_auth_token, 'utf-8');
    oauth2Client.credentials = JSON.parse(token);
    console.log('auth success');
  } catch (err) {
    console.log('auth error 1');
    throw 'auth token file not found please create new one.';
  }
};
const create_authorize_token_url = () => {
  try {
    const clientSecret = client_secret_data.installed.client_secret;
    const clientId = client_secret_data.installed.client_id;
    const redirectUrl = client_secret_data.installed.redirect_uris[0];
    const oauth2Client = new googleAuthLibrary.OAuth2Client(clientId, clientSecret, redirectUrl);

    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('---------------------');
    console.log(authUrl);
    console.log('---------------------');
  } catch (err) {
    throw err;
  }
};

const store_drive_token_file = async code => {
  try {
    const clientSecret = client_secret_data.installed.client_secret;
    const clientId = client_secret_data.installed.client_id;
    const redirectUrl = client_secret_data.installed.redirect_uris[0];
    console.log({ clientId, clientSecret, redirectUrl });
    const oauth2Client = new googleAuthLibrary.OAuth2Client(clientId, clientSecret, redirectUrl);
    const resdata = await oauth2Client.getToken(code);
    fs.writeFileSync(drive_auth_token, JSON.stringify(resdata.tokens));
    get_drive_auth_token_file();
    return { tokenCreated: 'success' };
  } catch (err) {
    throw err;
  }
};

removeEmptyParameters = params => {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
};

createResource = properties => {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value && typeof value == 'string') {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    }
  }
  return resource;
};

// create_authorize_token_url();
// store_drive_token_file('4/YwFVoTubstSMTdV9PNdgXEoJ6m19KFg4pSYn6QsrSXZkwS-iI3u4xAvI');

const main = async () => {
  get_drive_auth_token_file();
  await get_drive_details();
  upload_to_drive('text.txt');
};

main();
