#!/bin/bash

start_pwd=$(pwd)
abs_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd $abs_root

if [[ -d "$abs_root/refs/webref" ]]
then
    git submodule update
else
    git submodule add https://github.com/w3c/webref.git refs/webref
fi

cd $start_pwd
