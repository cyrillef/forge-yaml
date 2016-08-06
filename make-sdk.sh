#!/bin/sh

SCRIPT="$0"
YAML="$1"
shift

while [ -h "$SCRIPT" ] ; do
  ls=`ls -ld "$SCRIPT"`
  link=`expr "$ls" : '.*-> \(.*\)$'`
  if expr "$link" : '/.*' > /dev/null; then
    SCRIPT="$link"
  else
    SCRIPT=`dirname "$SCRIPT"`/"$link"
  fi
done

if [ ! -d "${APP_DIR}" ]; then
  APP_DIR=`dirname "$SCRIPT"`/..
  APP_DIR=`cd "${APP_DIR}"; pwd`
fi

executable="$APP_DIR/swagger-codegen/modules/swagger-codegen-cli/target/swagger-codegen-cli.jar"
[ ! -f "$executable" ] && mvn clean package


# if you've executed sbt assembly previously it will use that instead.

[ -d "clients/$YAML" ] && rm -Rf "clients/$YAML"

export JAVA_OPTS="${JAVA_OPTS} -DloggerPath=conf/log4j.properties"
ags="$@ generate -t $APP_DIR/swagger-codegen/modules/swagger-codegen/src/main/resources/Javascript \
   -i $YAML.yaml -l javascript \
   -o clients/$YAML \
   --additional-properties usePromises=true"

ags="$@ generate \
   -i $YAML.yaml -l adsk_nodejs \
   -o clients/$YAML \
   --additional-properties usePromises=true"

ags="$@ generate \
   -i $YAML.yaml -l ForgeJS \
   -o clients/$YAML \
   --additional-properties usePromises=true"

ags="$@ generate \
   -i $YAML.yaml -l forgejs \
   -o clients/$YAML"

java -DappName=$YAML $JAVA_OPTS -jar $executable $ags
