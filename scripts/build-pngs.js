// based on https://github.com/hampusborgos/country-flags/blob/master/scripts/build-pngs.js -->
var process = require('process')
var exec = require('child_process').exec
var fs = require('fs')
var path = require('path')

var help_message = "You must pass one argument to build-pngs. It should be target dimension in the format `200:` for width 200px, or `:200` for height 200px."
var svg_directory = 'svg/'

// Check arguments
function get_output_directory() {
    // Replace : with x, if two dimensions are specified
    var dim = process.argv[2].split(':');//.map(x => x.length > 0 ? )
    if(dim[0].length==0) dim[0]="W";
    if(dim[1].length==0) dim[1]="H";
    var dir = 'png' + (dim.length > 1 ? dim.join('x') : dim) + 'px'

    return dir
}

function get_output_dimensions() {
    return process.argv[2]
}

function check_arguments(callback) {
    if (process.argv.length < 3) {
        console.log(help_message)
        process.exit(1)
    }

    var dimensions = process.argv[2]
    if (/^[0-9]*:[0-9]*$/.test(dimensions) && dimensions.length > 2) {
        var output_folder = get_output_directory()
        console.log("Output folder: " + output_folder)
        
        if (!fs.existsSync(output_folder)){
            fs.mkdirSync(output_folder)
        }

        if (!fs.existsSync(output_folder+"_temp")){
            fs.mkdirSync(output_folder+"_temp");
        }

        var regex = process.argv[3] || "";
        console.log("regex: " + regex);

        callback(regex)
    }
    else {
        console.log(help_message)
        process.exit(1)
    }
}

function check_for_svgexport(callback) {
    // Check for presence of imagemin-cli and svgexport
    console.log("Checking if `svgexport` is available...")
    exec('svgexport', function(error, stdout, stderr) {
        if (stdout.indexOf("Usage: svgexport") !== -1) {
            callback()
        }
        else {
            console.log("`svgexport` is not installed.")
            console.log("Please run: npm install -g svgexport")
            process.exit(1)
        }
    })
}

function check_for_imagemin(callback) {
    // Check for presence of imagemin-cli and svgexport
    console.log("Checking if `imagemin-cli` is available...")
    exec("imagemin --version", function(error, stdout, stderr) {
        if (!error) {
            callback()
        }
        else {
            console.log("`imagemin-cli` is not installed.")
            console.log("Please run: npm install -g imagemin-cli")
            process.exit(1)
        }
    })
}

function get_all_svgs(regex, callback) {
    fs.readdir(svg_directory, function(err, items) {
        if (err) {
            console.log("Could not list *.svg files. You probably ran this command from the wrong working directory.")
            console.log(err)
            process.exit(1)
        }

        if(regex){
            items = items.filter(path => RegExp(regex).test(path));
        }
        //items = items.filter(path => /^[a-z\-]+\.svg$/.test(path))
        callback(items)
    }, (error) => {})
}

function convert_and_compress_svg(path_to_svg, outdir) {
    var filenameSVG = path.basename(path_to_svg);
    var filenamePNG = filenameSVG.substring(0, filenameSVG.length - 4) + '.png';

    var path_to_tmp_png = path.join(outdir+"_temp",filenamePNG);
    var outpath = path.join(outdir,filenamePNG);

    fs.access(outpath, err => {
    if(!err) return;
        var svgexport_command = "svgexport " + path_to_svg + " " + path_to_tmp_png + " pad " + get_output_dimensions();
        exec(svgexport_command, (error, stdout, stderr) => {
            if (error || stderr) {
                console.log(svgexport_command);
                console.log("Failed svgexport: " + path_to_svg,stderr);
                process.exit(1);
            }
            var image_min_command = "imagemin " + path_to_tmp_png + " --out-dir=" + outdir;
            exec(image_min_command, (error, stdout, stderr) => {
                // Always remove temp file
                //fs.unlink(path_to_tmp_png, (error) => {});
                if (error || stderr) {
                    console.log("Failed imagemin: " + path_to_svg,stderr);
                    process.exit(1);
                }
            });
        });
    });
}

function convert_all_files(svgs, callback) {
    var outdir = get_output_directory()

    console.log("Converting " + svgs.length + " to "+ outdir);

    svgs.forEach(function(svg){
        convert_and_compress_svg(svg_directory + svg, outdir)
    },this);

    console.log("Converting " + svgs.length + " done");
}

// Run the program
check_arguments((regex) =>
    check_for_imagemin(() =>
    check_for_svgexport(() =>
    get_all_svgs(regex, (svgs) => convert_all_files(svgs, () => {
        console.log("All SVGs converted to PNG!")
        process.exit(0)
    })
))))
