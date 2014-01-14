#!/usr/bin/perl -p

# tinydns log formatting utility
# based on Faried Nawaz's logfile formatter for dnscache
# based on Kenji Rikitake <kenji.rikitake@acm.org> 29-JUL-2000
# by zimmerle 26-Dez-2013

use MIME::Base32 qw( RFC );
use Geo::IP;
use DBI;

require "modsec-tinydns-parser-config.pl";

our $tail, $geo_lite_db, $mysql_dbi, $mysql_username, $mysql_password, $log_uri;

my $gi = Geo::IP->open($geo_lite_db, GEOIP_STANDARD);
my $dbh = DBI->connect($mysql_dbi, $mysql_username, $mysql_password) or die "Connection Error: $DBI::errstr\n";

if ($log_uri) {
	open(LOG, ">>$log_uri" ) || die "Problems opening log file";
	print LOG time . " Start!\n";
}

s/\b([a-f0-9]{8})\b/join(".", unpack("C*", pack("H8", $1)))/eg;
s/^(@[a-f0-9]+) \b([\d.]+):(\w+):(\w+) ([\+\-\I\/]) \b([a-f0-9]+) \b([-.=\w]+)\n/printQueryLine($1, $2,$3,$4,$5,$6,$7)/e;

sub scape {
  my ($str) = @_;
  $str =~ s/[^0-9.-]+//g;
  return $str;
}

sub printQueryLine {
  my ($date, $host, $port, $query_id, $flag, $query_type, $query) = @_;

  return if (!($query =~ m/$tail$/));

  my $ret = $query;
 
  $ret =~ s/\d+\.$tail$//g;
  $ret =~ s/\.//g;
  $ret = MIME::Base32::decode(uc $ret);

  return if (!($ret =~ m/^[A-z0-9-_,.)(\/ ]+$/));
  my $l = time . ",$host,$ret";
  my ($modsec, $apache, $apr, $pcre, $lua, $libxml, $install_id) = split(/,/, $ret);

  ($apr, $apr_loaded) = split(/\//, $apr);
  ($pcre, $pcre_loaded) = split(/\//, $pcre);
  ($lua, $lua_loaded) = split(/\//, $lua);
  ($libxml, $libxml_loaded) = split(/\//, $libxml);

  $modsec = scape($modsec);
  $apache = scape($apache);
  $apr = scape($apr);
  $apr_loaded = scape($apr_loaded);
  $pcre = scape($pcre);
  $pcre_loaded = scape($pcre_loaded);
  $lua = scape($lua);
  $lua_loaded = scape($lua_loaded);
  $libxml = scape($libxml);
  $libxml_loaded = scape($libxml_loaded);
  $install_id = scape($install_id);

  my $record, $latitude, $logitude, $country, $city;
  if ($record)
  {
    $record = $gi->record_by_addr($host);
    $latitude = $record->latitude;
    $longitude = $record->longitude;
    $country = $record->country_name;
    $city = $record->city;

    $country =~ s/\'/\\'/g;
    $city =~ s/\'/\\'/g;
  }

  my $sql = "insert into status (host, modsec, apache, apr, apr_loaded, pcre, ".
            "pcre_loaded, lua, lua_loaded, libxml, libxml_loaded, payload, " .
            "latitude, longitude, country, city, id) values ".
            "('$host', '$modsec', '$apache', '$apr', '$apr_loaded', " .
            "'$pcre', '$pcre_loaded', '$lua', '$lua_loaded', '$libxml', " .
            "'$libxml_loaded', '$ret', '$latitude', '$longitude', " .
	    "'$country', '$city', '$install_id')";

  $sth = $dbh->prepare($sql);
  $sth->execute or die "SQL Error: $DBI::errstr\n";

  if ($log_uri) {
    print LOG "Adding: $sql\n";
  }
  return "Adding: $sql\n";
}

if ($log_uri) {
  close(LOG);
}

