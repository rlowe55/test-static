#!/bin/sh
# put a single file from CMS to the CDN Master
# delete a single file from the CDN Master

# Config
user="cdnupdate"
pass="e0aa12507f3e20"
export SSHPASS="$pass"
path_file_upload_static="../public/file-uploads/static/"

put_file() {
echo " Sending [$1] from CMS Editor -> CDN Master"
sshpass -e sftp -oBatchMode=no -b - $user@cdn-master.rcsb.org << !
   cd pdb101
   cd static
   put $1
   bye
!
}

delete_file() {
echo " Deleting [$1] from CDN Master"
sshpass -e sftp -oBatchMode=no -b - $user@cdn-master.rcsb.org << !
   cd pdb101
   cd static
   rm $1
   bye
!
}

# Make sure sshpass is installed
checkPass=`which sshpass | wc -l`
if [ $checkPass = 0 ]
then
    # apt-get will not run on osx, and using brew fails - see note for installing sshpass on osx
    # this will work on ubuntu
	apt-get install -y sshpass
fi

# TODO restict file size to max bootstrap width?
# Handle the re-sizing of image
#find $path_file_upload_hp -name *.jpg -print -exec ./thumbnails-replace_orig.sh {} {}-small 360 \;


if [ $1 = "put" ]
then
    file="${path_file_upload_static}"$2
    echo "${file}"
    put_file $file
    # TODO logic for rm
    #rm -f $file
elif [ $1 = "delete" ]
then
    delete_file $2
    # TODO logic for rm
    #rm -f $file
else
    echo "Unknown mode passed [$1]"
fi




# note 1:
# -- sshpass Installing on OS X
# -- Download the Source Code at http://sourceforge.net/projects/sshpass/
# -- Extract it and cd into the directory, then run:
# ./configure
# sudo make install
