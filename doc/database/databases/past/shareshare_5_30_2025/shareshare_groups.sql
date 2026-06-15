-- MySQL dump 10.13  Distrib 8.0.41, for macos15 (arm64)
--
-- Host: localhost    Database: shareshare
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `group_id` int NOT NULL AUTO_INCREMENT,
  `group_type` varchar(255) NOT NULL DEFAULT 'normal',
  `created_by` varchar(255) NOT NULL DEFAULT '',
  `group_name` varchar(255) NOT NULL DEFAULT 'name me!',
  `group_image` varchar(255) NOT NULL DEFAULT 'group.png',
  `group_key` varchar(255) NOT NULL DEFAULT 'nokey',
  `group_private` int NOT NULL DEFAULT '1',
  `group_deleted` int NOT NULL DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT '1995-07-20 05:06:22',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=575 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (70,'kite','davey','New Group!','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2023-11-27 00:26:27'),(72,'kite','davey','New Group!','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2023-11-27 00:34:26'),(563,'kite','davey','hiking!!','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-14 23:49:42'),(564,'kite','davey','hiking!!','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-18 00:01:32'),(565,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-18 00:14:45'),(566,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-20 01:07:55'),(567,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-21 00:32:38'),(568,'kite','davey','hiking!!','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-25 23:27:03'),(569,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-27 22:53:31'),(570,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-02-28 23:34:27'),(571,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-03-05 00:38:13'),(572,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-03-05 00:38:20'),(573,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-03-06 00:24:01'),(574,'kite','davey','music','the_shire.jpg','nokey',1,0,'1995-07-20 05:06:22','2025-03-07 23:43:57');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-30 16:22:06
