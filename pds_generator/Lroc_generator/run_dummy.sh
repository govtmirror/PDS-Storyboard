#!/bin/bash

if [ $# -ne 3 ]; then
    echo "usage: sh $0 <input> <output> <map>"
    exit 1
fi

from=$1
to=$2

if [ ! -f $3 ]; then
    echo "can not find $3, please check the path."
    exit 1
fi

placeholder_image=./placeholder.jpg
mkdir -p $to
for f in `ls $from`
do

    if [ -f $from/$f ]; then
        if [ ${f##*.} = IMG ]; then
            filename=`basename $f .IMG`

            echo ''
            echo '****************************************************'
            echo "       Process Steps for file: $filename"
            echo '****************************************************'
            echo ''

            result=$to/$filename\_final.jpg
            cp $placeholder_image $result

        fi
    fi
done
