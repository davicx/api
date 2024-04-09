-- MySQL dump 10.13  Distrib 8.0.31, for macos12 (x86_64)
--
-- Host: localhost    Database: shareshare
-- ------------------------------------------------------
-- Server version	8.0.22

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
-- Table structure for table `folders`
--

DROP TABLE IF EXISTS `folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `folders` (
  `folder_id` int NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `group_id` int NOT NULL,
  `parent_folder` int NOT NULL,
  `folder_name` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `folder_image` varchar(255) NOT NULL,
  `folder_seen` int NOT NULL,
  `folder_status` int NOT NULL,
  `recycle_status` int NOT NULL,
  `folder_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `folder_last_modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`folder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folders`
--

LOCK TABLES `folders` WRITE;
/*!40000 ALTER TABLE `folders` DISABLE KEYS */;
INSERT INTO `folders` VALUES (108,'',321,0,'Music','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:28:57','2019-05-10 23:28:57'),(109,'',321,0,'Movies','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:29:49','2019-05-10 23:29:49'),(110,'',321,108,'Anberlin','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:30:45','2019-05-10 23:30:45'),(111,'',321,110,'Cities','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:30:52','2019-05-10 23:30:52'),(112,'',321,108,'Hammock','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:56:17','2019-05-10 23:56:17'),(113,'',321,112,'Departure Songs','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:56:44','2019-05-10 23:56:44'),(114,'',321,112,'Kenotic','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:56:59','2019-05-10 23:56:59'),(115,'',321,109,'Lost','vasquezd',1,'folder.png',0,1,0,'2019-05-10 23:57:09','2019-05-10 23:57:09'),(116,'',321,0,'Games','vasquezd',1,'folder.png',0,1,0,'2019-05-15 23:43:04','2019-05-24 22:28:47'),(117,'',321,0,'Me','vasquezd',1,'folder.png',0,0,1,'2019-05-22 22:35:22','2019-05-22 22:35:40'),(118,'',321,0,'Hi','vasquezd',1,'folder.png',0,0,1,'2019-05-22 22:36:07','2019-05-22 22:36:10'),(119,'shareshare',321,0,'hi','vasquezd',1,'folder.png',0,0,1,'2019-08-15 22:28:07','2019-08-15 22:28:10');
/*!40000 ALTER TABLE `folders` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-07-02 13:23:24
