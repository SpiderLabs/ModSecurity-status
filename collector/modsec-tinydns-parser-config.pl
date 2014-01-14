#!/usr/bin/perl -p

our $tail, $geo_lite_db, $mysql_dbi, $mysql_username, $mysql_password, $log_uri;

$tail = "status.modsecurity.org";
$geo_lite_db = "/usr/local/apache/conf/GeoLiteCity.dat";

$mysql_dbi = "dbi:mysql:modsecurity_db_goes_here";
$mysql_username = "db_username_goes_here";
$mysql_password = "db_password_goes_here";

$log_uri = "/tmp/tinydns-parser-collector.txt";

1;

