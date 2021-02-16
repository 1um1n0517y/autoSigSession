//-------------------------------------
//GET DATA FROM DEPLOYER HISTORY
//-------------------------------------

const request = require('request');
const fs = require('fs');
var args = process.argv;
//MANUAL
if (args[2] == undefined || args[3] == undefined || args[4] == undefined || args[5] == undefined || args[6] == undefined) {
    console.log("Input arguments to run script\nexample: node script.js SGD-CleopatraIW.ML2.0.0.CL350853.V1.0.11.RELEASE_83 PGF-TempleOfFire_1.2.1_RELEASE_16 cust02 milic ********")
    return;
}
var serverPackage = args[2];
var clientPackage = args[3];
const environment = args[4];
const user = args[5];
const pass = args[6];


//SPERATE PREFIX FROM PACKAGE NAME FOR CLIENT
var clientPackageArray = clientPackage.split("-");
const clientPackagePrefix = clientPackageArray[0];
var clientPackage = clientPackageArray[1];

//SPERATE PREFIX FROM PACKAGE NAME FOR SERVER
var serverPackageArray = serverPackage.split("-");
const serverPackagePrefix = serverPackageArray[0];
var serverPackage = serverPackageArray[1];


//SET WEB, skateboardSGD or PGF
switch (clientPackagePrefix) {
    case "WEB": 
        var services = ["WEB", "SGD", "skateboard", "RGSFULLDEPLOY"];
        break;
    case "skateboardSGD":
        var services = ["skateboardSGD", "SGD", "skateboard", "RGSFULLDEPLOY"];
        break;
    case "PGF":
        var services = ["PGF", "SGD", "skateboard", "RGSFULLDEPLOY"];
        break;
    default:
        console.log("\nAborting. Please enter client package name prefix correctly (WEB, skateboardsSGD, PGF)");
        return;
}





console.log('\n\nStarting auto screenshot script...\n')

function getDataFromDeployer () {

    console.log('\nScraping deployer history pages for data...\n')

    //const services = ["WEB", "SGD", "skateboard", "RGSFULLDEPLOY"];

    for (var i = 0; i < services.length;i++) {
        var apiRequest = services[i]; 
        requestGet(apiRequest);  
    }

    //WRITE HTML FILES FOR DEPLOYER HISTORY SERVICES - /scrapedPage
    function requestGet (service) {
        request.get('http://deploy.corp.wagerworks.com:7000/deployer/php/deployment.php?action=hist&service=' + service + '&domain=rgsmvn&sort=date', 
            {
                'auth': {
                    'user': user,
                    'pass': pass,
                    'sendImmediately': false
                }
            }, 
            function (error, response, body) {
                console.log(service + ' http connection returned status code ' + response.statusCode)
                if (!error && response.statusCode == 200) {
                    fs.writeFile('scrapedPages/' + service + '.html', body, function(err) {
                        if(err) {
                            return console.log(err);
                        }
                    });
                } else {
                    console.log(error)
                }
            }
        )

    }

}

//-------------------------------------
//CREATE HTML PAGES FOR SERVER AND CLIENT GAME FILES
//-------------------------------------


function createHtmlForGames () {

    console.log('\n\nCreating template HTML pages...\n')

    const services = [clientPackagePrefix, "SGD"];

    var x = [];

    function getData (service, i) {

        

        fs.readFile(__dirname + '/scrapedPages/' + service + '.html', function read(err, data) {
            if (err) {
                throw err;
            }

            if (service == "SGD") {
                var package = serverPackage
            } else if (service == clientPackagePrefix) {
                var package = clientPackage;
            } else {
                //FOR "skateboard", "RGSFULLDEPLOY"
                var package = '.*';
                // console.log("Please check package names.")
                // return;
            }

            const regex = new RegExp(`<TD class='display'>` + service + `<\/TD>\n<TD class='display'>${package}<\/TD>\n<TD class='display'>[a-zA-Z]*<\/TD>\n<TD class='display'>${environment}<\/TD>\n<TD class='display'>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}<\/TD>`, 'gi');

            //MAKE READ DATA A STRING
            data = data.toString();

            //
            var matchedLines = data.match(regex)
            
            try {
                x.push(matchedLines[0]);
                x[i] = x[i].replace(/(\r\n|\n|\r)/gm, "");
            } catch (err) {
                console.log(`\n\nAborting. Check if the packages ${serverPackage} and ${clientPackage} are deployed to ${environment}\n\n`);
                process.exit(1);
            }


            //---------------------------------------------------------------------------------------------------------------
            var fileName = __dirname + `/templatePages/${service}.html`;
            var stream = fs.createWriteStream(fileName);

            //HTML CONTENT
            function buildHtml(req) {
                //BUILD HEADER AND BODY
                var header = '<title>Deployer Screenshot</title><style>body { font-size: 12px; color: black; background-color: #AACCDD; margin:0;font-weight: 100; } table {border-collapse: separate;white-space: normal;line-height: normal;font-weight: normal;font-size: medium;font-style: normal;text-align: start;border-spacing: 0px;font-variant: normal;}td { height:20px; border: 1px #333 solid; border-left: 0;padding: 8px;color: black;background-color: #DDDDDD;font-size: 16px;margin:0;max-height:18px;} .display:nth-child(1) { min-width:135px; border-left: 1px #333 solid; } .display:nth-child(2) { min-width:550px; } .display:nth-child(3) { min-width:83px; } .display:nth-child(4) { min-width:109px; } .display:nth-child(5) { min-width:140px; }</style>';
                var body = x[i];

                //RETURN COMPLETE HTML
                return '<!DOCTYPE html>'
                    + '<html><head>' + header + '</head><body><table>' + body + '</table></body></html>';
            };


            //CREATE HTML FILES
            stream.once('open', function(fd) {
            var html = buildHtml();

            stream.end(html);
            });

        });

    }

    //--------------------------------------------------EXECUTION-------------------------------------------

    for (var i = 0; i < services.length;i++) {
        var service = services[i]; 
        getData(service, i); 
        console.log(service + ' HTML page created.'); 
    }

}


//-------------------------------------
//CREATE HTML PAGES FOR RGS FILES
//-------------------------------------


function createHtmlPagesForRGS () {

    

    const fs = require('fs');
    var args = process.argv;

    const environment = args[4];
    const serverPackage = args[2];
    const clientPackage = args[3];

    const services = ["skateboard", "RGSFULLDEPLOY"];

    var x = [];

    function getData (service, i) {

        fs.readFile(__dirname + '/scrapedPages/' + service + '.html', function read(err, data) {
            if (err) {
                throw err;
            }

            if (service == "SGD") {
                var package = serverPackage
            } else if (service == "WEB") {
                var package = clientPackage;
            } else {
                //FOR "skateboard", "RGSFULLDEPLOY"
                var package = '.*';
            }

            const regex = new RegExp(`<TD class='display'>` + service + `<\/TD>\n<TD class='display'>${package}<\/TD>\n<TD class='display'>[a-zA-Z]*<\/TD>\n<TD class='display'>${environment}<\/TD>\n<TD class='display'>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}<\/TD>`, 'gi');

            //MAKE READ DATA A STRING
            data = data.toString();

            //
            var matchedLines = data.match(regex)

            
            x.push(matchedLines[0]);
            //console.log(x[i])
            x[i] = x[i].replace(/(\r\n|\n|\r)/gm, "");

            // console.log(x[i])

            

            

            var fileName = __dirname + `/templatePages/${service}.html`;
            var stream = fs.createWriteStream(fileName);

            //HTML CONTENT
            function buildHtml(req) {
                //BUILD HEADER AND BODY
                var header = '<title>Deployer Screenshot</title><style>body { font-size: 12px; color: black; background-color: #AACCDD; margin:0;font-weight: 100; } table {border-collapse: separate;white-space: normal;line-height: normal;font-weight: normal;font-size: medium;font-style: normal;text-align: start;border-spacing: 0px;font-variant: normal;}td { height:20px; border: 1px #333 solid; border-left: 0;padding: 8px;color: black;background-color: #DDDDDD;font-size: 16px;margin:0;max-height:18px;} .display:nth-child(1) { min-width:135px; border-left: 1px #333 solid; } .display:nth-child(2) { min-width:550px; } .display:nth-child(3) { min-width:83px; } .display:nth-child(4) { min-width:109px; } .display:nth-child(5) { min-width:140px; }</style>';
                var body = x[i];

                //RETURN COMPLETE HTML
                return '<!DOCTYPE html>'
                    + '<html><head>' + header + '</head><body><table>' + body + '</table></body></html>';
            };


            //CREATE HTML FILES
            stream.once('open', function(fd) {
            var html = buildHtml();

            stream.end(html);
            });

        });

    }

    //--------------------------------------------------EXECUTION-------------------------------------------

    for (var i = 0; i < services.length;i++) {
        var service = services[i]; 
        getData(service, i);  
        console.log(service + ' HTML page created.');
    }
}

//-------------------------------------
//CREATE SCREENSHOTS
//-------------------------------------

function createScreenshots () {

    console.log('\n\nCreating screenshots...\n');

    const captureWebsite = require('capture-website');
    //const services = [clientPackagePrefix, "SGD", "skateboard", "RGSFULLDEPLOY"];

    for (var i = 0; i < services.length; i++) {
        makeScreenshot(services[i]);
        console.log(services[i] + ' screenshot taken.')
    }

    function makeScreenshot (service) {
        (async () => {
            await captureWebsite.file(`templatePages/${service}.html`, `screens/${service == 'WEB' || service == 'skateboardSGD' || service == 'PGF' ? 'client' : service}.png`, {
                width: 1104,
                height: 38
            })
        })();
    }
}

getDataFromDeployer();

setTimeout(createHtmlForGames, 27000);
setTimeout(createHtmlPagesForRGS, 32000);
setTimeout(createScreenshots, 37000);
setTimeout(function() { console.log('\n\nFinished creating screenshots.\n') }, 39000);






