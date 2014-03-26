#!/usr/bin/perl

use DBI;

require "modsec-status-config.pl";

our $mysql_dbi, $mysql_username, $mysql_password;

$dbh = DBI->connect($mysql_dbi, $mysql_username, $mysql_password) or die "Connection Error: $DBI::errstr\n";

my $uri = $ENV{'REQUEST_URI'};
my ($unique) = $uri =~m/(unique)/;
my ($from, $to) = $uri =~ m/.*\/([\d+]+)\/([\d+]+)$/;

my $sql;

if ($unique)
{
	$sql = "select ts,modsec,apache,apr,apr_loaded,pcre,pcre_loaded," .
		"lua,lua_loaded,libxml,libxml_loaded,host,latitude,longitude, ".
		"country,city,id,UNIX_TIMESTAMP(ts) from status where " .
		"ts >= FROM_UNIXTIME($from) and ts < FROM_UNIXTIME($to) " .
		"group by id order by ts ASC LIMIT 0, 20000";
}
else
{
	$sql = "select ts,modsec,apache,apr,apr_loaded,pcre,pcre_loaded," .
		"lua,lua_loaded,libxml,libxml_loaded,host,latitude,longitude, ".
		"country,city,id,UNIX_TIMESTAMP(ts) from status where " .
		"ts >= FROM_UNIXTIME($from) and ts < FROM_UNIXTIME($to) " .
		"order by ts ASC LIMIT 0, 20000;";
}

$sth = $dbh->prepare($sql);
$sth->execute or die "SQL Error: $DBI::errstr\n";

print "Content-type: application/json\n\n";
print "{\n";
print ' "time": {' . "\n";
print '  "from": "' . $from . '",' . "\n";
print '  "to": "' . $to . '"' . "\n";
print ' },' . "\n";
print ' "amount": ' . $sth->rows . ",\n";
print ' "results": [' . "\n";
$count = 0;

while (@row = $sth->fetchrow_array) {
    print '  {' . "\n";
    print '   "ts": "' . $row[0] . '"' . ",\n" if ($full);
    print '   "ts_epoch": "' . $row[17] . '"' . ",\n";
    print '   "version": "' . $row[1] . '"' . ",\n";
    print '   "installation_id": "' . $row[16] . '"' . ",\n" if ($full);
    print '   "apache": "' . $row[2] . '"' . ",\n" if ($full);
    print '   "apr": {' . "\n" if ($full);
    print '    "compiled": "' . $row[3] . '"' . ",\n" if ($full);
    print '    "running": "' . $row[4] . '"' . "\n" if ($full);
    print '   },' . "\n" if ($full);
    print '   "pcre": {' . "\n" if ($full);
    print '    "compiled": "' . $row[5] . '"' . ",\n" if ($full);
    print '    "running": "' . $row[6] . '"' . "\n" if ($full);
    print '   },' . "\n" if ($full);
    print '   "lua": {' . "\n" if ($full);
    print '    "compiled": "' . $row[7] . '"' . ",\n" if ($full);
    print '    "running": "' . $row[8] . '"' . "\n" if ($full);
    print '   },' . "\n" if ($full);
    print '   "libxml": {' . "\n" if ($full);
    print '    "compiled": "' . $row[9] . '"' . ",\n" if ($full);
    print '    "running": "' . $row[10] . '"' . "\n" if ($full);
    print '   },' . "\n" if ($full);
    print '   "dns_server": {' . "\n";
    print '    "ip": "' . $row[11] . '"' . ",\n" if ($full);
    print '    "latitude": "' . $row[12] . '"' . ",\n";
    print '    "longitude": "' . $row[13] . '"' . ",\n";
    print '    "country": "' . $row[14] . '"' . ",\n" if (full);
    print '    "city": "' . $row[15] . '"' . "\n";
    print '   }' . "\n";
    $count++;
    if ($count == $sth->rows) {
        print '  }' . "\n";
    } else {
        print '  },' . "\n";
    }
} 

print ' ]' . "\n";
print "}\n";

