#!/bin/sh

FORGE="`dirname \"$0\"`" # Relative
export FORGE="`( cd \"$FORGE\" && pwd )`" # Absolutized and normalized
pushd $FORGE > /dev/null


echo "Listing definitions..."
declare -a _yamls=();
for entry in ./v*/*.yaml; do
	_yamls=("${_yamls[@]}" $entry)
done

declare -a yamls=();
for entry in ${_yamls[@]}; do
	#declare -a patter=( ${Unix[@]/Red*/} )
	#echo $entry
	version="`([[ $entry =~ .*\/v([0-9]+)\/(.*) ]] && echo ${BASH_REMATCH[1]})`"
	filename="`([[ $entry =~ .*\/v([0-9]+)\/(.*) ]] && echo ${BASH_REMATCH[2]})`"
	yamls=("${yamls[@]}" $entry)
	COUNT=`expr $version - 1`
	for i in $(seq -1 $COUNT); do
		st="./v$i/$filename"
		declare -a res=( ${yamls[@]/$st/} )
		yamls=("${res[@]}")
	done
done

echo "Flattering definitions (yaml & json)..."
for entry in ${_yamls[@]}; do
	filename="`([[ $entry =~ .*\/v([0-9]+)\/(.*)\.yaml ]] && echo ${BASH_REMATCH[2]})`"
#	node yaml-tools.js flattern $entry > output/${filename}.yaml
#	node yaml-tools.js flattern $entry --json > output/${filename}.json
done

echo "Generating SDKs..." # php, ruby, csharp, forgejs
declare -a langs=("php" "ruby" "csharp")
for entry in ${_yamls[@]}; do
	filename="`([[ $entry =~ .*\/v([0-9]+)\/(.*)\.yaml ]] && echo ${BASH_REMATCH[2]})`"
	for lang in ${langs[@]}; do
		echo "    ($lang) $filename ..."
		node yaml-tools.js sdk $lang output/${filename}.yaml "clients/${lang}-${filename}.zip"
	done
done
