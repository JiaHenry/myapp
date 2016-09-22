var fs = require('fs');
var execSync = require('child_process').execSync;
var platform = process.platform;

var platformSwitch, win = false;

switch (platform) {
    case 'win32':
        win = true;
        platformSwitch = '-w';
        break;

    case 'darwin':
        platformSwitch = '-m';
        break;

    case 'linux':
    default:
        platformSwitch = '-l';
        break;
}

var cmdBuild = `npm run dist${platformSwitch}`,
    cmdDeleteOldDist = win ? `IF EXIST @ (rd /S /Q @)` : `rm -rf @`,
    cmdRenameApp = win ? `cd app && rename @ app` : `mv app/@ app/app`,
    cmdRenameBack = win ? `cd app && rename app @` : `mv app/app app/@`,
    cmdRenameDist = win ? `rename dist @` : `mv dist @`;

console.log('Start process ...');
['en', 'cn', 'jp'].forEach((name, index) => {
    console.log(`package for ${name} ...`);
    var distPath = `dist_${name}`, renamed = false;
    try {
        console.log('Delete old dist folder ...');
        execSync(cmdDeleteOldDist.replace(/@/g, distPath));
        console.log('Rename to app for builder ...')
        execSync(cmdRenameApp.replace(/@/g, name));
        renamed = true;
        console.log('Build package ...')
        execSync(cmdBuild);
        console.log('Rename app back to', name);
        execSync(cmdRenameBack.replace(/@/g, name));
        renamed = false;
        console.log('rename output folder ...');
        execSync(cmdRenameDist.replace(/@/g, distPath));
    } catch (e) {
        console.log(`Error for ${name}`, e.message || e);
        if (renamed) {
            execSync(cmdRenameBack.replace(/@/g, name));
        }
        return;
    }
});

console.log('Done')