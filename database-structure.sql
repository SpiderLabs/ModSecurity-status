--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
      `ts` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      `payload` varchar(400) DEFAULT NULL,
      `host` varchar(15) DEFAULT NULL,
      `modsec` varchar(15) DEFAULT NULL,
      `apache` varchar(15) DEFAULT NULL,
      `apr` varchar(15) DEFAULT NULL,
      `apr_loaded` varchar(15) DEFAULT NULL,
      `pcre` varchar(15) DEFAULT NULL,
      `pcre_loaded` varchar(15) DEFAULT NULL,
      `lua` varchar(15) DEFAULT NULL,
      `lua_loaded` varchar(15) DEFAULT NULL,
      `libxml` varchar(15) DEFAULT NULL,
      `libxml_loaded` varchar(15) DEFAULT NULL,
      `well_formated` int(1) DEFAULT '1',
      `latitude` varchar(14) DEFAULT NULL,
      `longitude` varchar(14) DEFAULT NULL,
      `country` varchar(20) DEFAULT NULL,
      `city` varchar(20) DEFAULT NULL,
      `id` varchar(40) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

