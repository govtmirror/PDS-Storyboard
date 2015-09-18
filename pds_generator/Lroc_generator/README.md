#lroc_converter

This is a utility script, that gets urls of LROC images from a
database, downloads the images and converts them to JPEG.

## Install

To deploy this script, first cd to the root directory

    cd lroc_converter

and run

    npm install

Then open the file config.json and configure your database access
credentials.

Follow the guide on https://github.com/topcoderinc/lmmp_api/blob/master/docs/How-To-Run-ISIS-Script.md to setup the environment for the converter script (run.sh)

## Install using virtualenv

Using virtualenv, you can create a virtual environment to test your
node applications in. To create a testing environment, install
virtualenv (e.g. on ubuntu, sudo apt-get install virtualenv)

Unzip the package

    unzip lroc_converter.zip

Then, change to the lroc_converter directory

    cd lroc_converter

Create the virtual environment

    virtualenv venv

Activate the virtual environment

    source venv/bin/activate

Install the dependencies

    npm install

Now, you can run the application using

    node run.js

When you are done with the virtual environment, you can simply
deactivate it by running the command

    deactivate

To remove the virtual environment, you can simply delete the venv
directory

    rm -rf venv

## Usage

    node run.js
    node run.js --limit m --offset n --config ./config.json

The command line arguments are all optional. You can limit the number
of images that are processed using the --limit argument (and an
optional offset into the database table using --offset). If you want
to use a different configuration file, you can specify it using the
--config argument.

## Testing

The distribution contains a dummy run_dummy.sh script that does
nothing but create an output jpeg image as would the real run.sh
script do. You can use this dummy script to test the application by
using the config_test.json configuration:

    node run.js --config ./config_test.json
