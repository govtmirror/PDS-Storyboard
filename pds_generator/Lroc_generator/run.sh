if [ $# -ne 3 ]; then
    echo "usage: sh $0 <input> <output> <map>"
    exit 1
fi

## ISIS setup
export ISISROOT=/home/isis/isis
. $ISISROOT/scripts/isis3Startup.sh
if [ $? -ne 0 ]; then
    echo "$ISISROOT/scripts/isis3Startup.sh could not be found"
    exit 1
fi
## update FWTTools to correct folder path
## download : ftp://pdsimage2.wr.usgs.gov/pub/pigpen/GDAL/FWTools-linux-x86_64-3.0.6f-usgs.tar.gz
export PATH=$PATH:$ISISROOT/3rdParty/lib:/home/isis/FWTools-linux-x86_64-3.0.6f-usgs/bin_safe

from=$1
to=$2
map=`readlink -f $3`
if [ ! -f $map ]; then
    echo "can not find $map, please check the path."
    exit 1
fi

mkdir -p $to
for f in `ls $from`
do
    filepath=`readlink -f $from/$f`
    if [ -f $filepath ]; then
        if [ ${f##*.} = IMG ]; then
            filename=`basename $f .IMG`

            cur=`readlink -f $to`

            echo ''
            echo ''
            echo '****************************************************'
            echo '       Process Steps for file'
            echo '       '$filename
            echo '****************************************************'
            echo ''

            input=$cur/$filename.tmpin.cub
            final=$cur/$filename\_final.cub
            output=$cur/$filename.tmpout.cub
            result=$cur/$filename\_final.jpg

            echo '*********************** PROCESS **********************'
            echo '     ISIS Ingest'
            echo '     Ingest PDS file into ISIS 3 camera space'
            echo '*** ISIS3 COMMAND ***'
            echo '     lronac2isis from='$filepath' to='$output
            echo ''
            lronac2isis from=$filepath to=$output
            echo 'Link to ISIS 3 Application Help'
            echo '     http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/lronac2isis/lronac2isis.html'
            echo ''
            mv $output $input


            echo '*********************** PROCESS **********************'
            echo '     spiceinit'
            echo '     Update camera pointing information'
            echo '*** ISIS3 COMMAND ***'
            echo '     spiceinit from='$input' ckpredicted=yes cknadir=yes'
            echo ''
            spiceinit from=$input ckpredicted=yes cknadir=yes
            echo 'Link to ISIS 3 Application Help'
            echo '     http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/spiceinit/spiceinit.html'
            echo ''

            echo '*********************** PROCESS **********************'
            echo '     ISIS Calibration'
            echo '     Applies radiometric corrections'
            echo '*** ISIS3 COMMAND ***'
            echo '     lronaccal from='$input' to='$output
            echo ''
            lronaccal from=$input to=$output
            echo 'Link to ISIS 3 Application Help'
            echo '     http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/lronaccal/lronaccal.html'
            echo ''
            rm $input
            mv $output $input

            echo '*********************** PROCESS **********************'
            echo '     lronacecho'
            echo '     Remove echo effects from LRO NAC image'
            echo '*** ISIS3 COMMAND ***'
            echo '     lronacecho from='$input' to='$output
            echo ''
            lronacecho from=$input to=$output
            echo 'Link to ISIS 3 Application Help'
            echo '     http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/lronacecho/lronacecho.html'
            echo ''
            rm $input
            mv $output $input

            echo '*********************** PROCESS **********************'
            echo '     cam2map'
            echo '     Project from camera space to map space'
            echo '*** ISIS3 COMMAND ***'
            echo '     cam2map from='$input' to='$output' map='$map' matchmap=no pixres=MAP defaultrange=minimize'
            echo ''
            cam2map from=$input to=$output map=$map matchmap=no pixres=MAP defaultrange=minimize
            echo 'Link to ISIS 3 Application Help'
            echo '     http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/cam2map/cam2map.html'
            echo ''
            rm $input
            mv $output $input

            echo '*********************** PROCESS **********************'
            echo '     stretch'
            echo '     Applies a min and max percent stretch to image'
            echo '*** ISIS3 COMMAND ***'
            echo '     stretch from='$input' to='$output' usepercentages=yes pairs="0:1 0.5:1 99.5:254 100:254" null=0 lis=0 lrs=0 his=255 hrs=255'
            echo ''
            stretch from=$input to=$output usepercentages=yes pairs="0:1 0.5:1 99.5:254 100:254" null=0 lis=0 lrs=0 his=255 hrs=255
            echo 'Link to ISIS 3 Application Help'
            echo '     http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/stretch/stretch.html'
            echo ''
            rm $input
            mv $output $input

            echo '*********************** PROCESS **********************'
            echo '     cubeatt'
            echo '     Change the bit type of an ISIS cube'
            echo '*** ISIS3 COMMAND ***'
            echo '     cubeatt from='$input' to='$output'+lsb+tile+attached+unsignedbyte+1:254'
            echo ''
            cubeatt from=$input to=$output+lsb+tile+attached+unsignedbyte+1:254
            echo 'Link to ISIS 3 Application Help'
            echo 'http://isis.astrogeology.usgs.gov/Application/presentation/Tabbed/cubeatt/cubeatt.html'
            echo ''
            rm $input
            mv $output $final

            echo '*********************** PROCESS **********************'
            echo '   GDAL::Translate'
            echo '*** COMMAND ***'
            echo '  gdal_translate  -ot Byte  -of PNG -outsize 1000 1000 '$final' '$result
            gdal_translate  -ot Byte  -of PNG -outsize 1000 1000 $final $result
            echo ''
            echo ''
        fi
    fi
done
