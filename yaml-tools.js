//
// Copyright (c) 2016 Autodesk, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// by Cyrille Fauvel
// Autodesk Forge Partner Development)
// July 2016
//
var program =require ('commander') ;
var moment =require ('moment') ;
var request =require ('request') ;
var async =require ('async') ;
var Promise =require ('promise') ;
var ejs =require ('ejs') ;
//var prettyjson =require ('prettyjson') ;
var Resolve =require ('json-refs').resolveRefs ;
//var yaml =require ('js-yaml') ;
var yaml =require ('yaml-js') ;

var fs =require ('fs') ;
//var url =require ('url') ;
//var path =require ('path') ;

var swaggerGeneratorServer ='http://generator.swagger.io/api/gen/clients/'

program
    .command ('flattern')
    .description ('validate command')
    .arguments ('<yamlFile>')
    .option ('-j, --json', 'output a json file')
    .action (function (yamlFile, options) {
        loadYaml (yamlFile, false)
            .then (function (results) {
                if ( options && options.hasOwnProperty ('json') )
                    console.log (JSON.stringify (results.resolved, null, 2)) ;
                else
                    console.log (yaml.dump (results.resolved)) ;
            }) ;
    }) ;

program
    .command ('languages')
    .description ('languages command')
    .action (function (options) {
        request.get (swaggerGeneratorServer, function (err, httpResponse, body) {
            console.log (JSON.stringify (JSON.parse (body), null, 2)) ;
        }) ;
}) ;

program
    .command ('sdk')
    .description ('sdk generation')
    .arguments ('<language> <yamlFile> [outputFile]')
    .action (function (language, yamlFile, outputFile, options) {
        outputFile =outputFile || (yamlFile + '.' + language + '.zip') ;
        loadYaml (yamlFile, true)
            .then (function (results) {
                console.log ('Generating your ' + language + ' SDK...') ;
                request.post ({
                        url: (swaggerGeneratorServer + language),
                        json: { spec: results.resolved }
                    },
                    function (err, httpResponse, body) {
                        //{ code: '3644ad53-1e6b-4feb-b335-d731d5fbeabc',
                        //  link: 'http://generator.swagger.io:80/api/gen/download/3644ad53-1e6b-4feb-b335-d731d5fbeabc' }
                        if ( body.link === undefined )
                            return (console.error ('No SDK generated! ' + body.message)) ;
                        console.log ('Downloading your SDK... (' + body.link + ')') ;
                        request.get ({ url: body.link, rejectUnauthorized: false })
                            .pipe (fs.createWriteStream (outputFile).on ('finish', function () {
                                console.log ('SDK saved @ ' + outputFile) ;
                            })) ;
                    }) ;
            }) ;
    }) ;


program
    .version ('1.0.0')
    //.option ('-u, --usage', 'Usage')
    //.on ('--help', usage)
    .parse (process.argv) ;


//-----------------------------------------------------------------------------
function loadYaml (yamlFile, bLog) {
    bLog =bLog || false ;
    if ( bLog )
        console.log ('Loading ' + yamlFile + '...') ;
    var yaml_loaderOptions ={
        filter: ['relative', 'remote'],
        loaderOptions : {
            processContent: function (res, callback) {
                var partial =yaml.load (res.text/*.replace ('\t','  ')*/) ;
                callback (null, partial) ;
            }
        }
    } ;

    return (new Promise (function (_resolve, _reject) {
        try {
            var root =yaml.load (fs.readFileSync (__dirname + '/' + yamlFile, 'utf8').toString ()/*.replace ('\t','  ')*/) ;
            Resolve (root, yaml_loaderOptions)
                .then (function (results) {
                    _resolve (results) ; // results.resolved
                }) ;
        } catch ( e ) {
            console.log (e) ;
            _reject (e) ;
        }
    })) ;
}
