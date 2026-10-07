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
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `comment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL DEFAULT '0',
  `comment` text,
  `comment_type` varchar(256) NOT NULL DEFAULT 'post',
  `comment_from` varchar(255) NOT NULL DEFAULT '',
  `comment_deleted` int NOT NULL DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (1,72,'Hiya sam! I do want to go!','post','david',0,'2021-11-22 07:39:11','2021-11-22 07:39:11'),(2,72,'Cool how fun! ','post','sam',0,'2021-11-22 07:39:11','2021-11-22 07:39:11'),(3,70,'Hiya sam! I do want to go!','post','davey',0,'2023-02-26 01:24:26','2021-11-22 07:39:11'),(4,70,'Cool how fun! ','post','sam',0,'2021-11-22 07:39:11','2021-11-22 07:39:11'),(119,5,'hiya!','post','sam',0,'2023-02-26 01:05:05','2023-02-26 01:05:05'),(120,70,'Hiya Frodo!! The weather is perfect! wanna hike or we could garden!','post','davey',0,'2023-02-26 01:14:21','2023-02-26 01:14:21'),(121,70,'Hiya Frodo!! The weather is perfect! wanna hike or we could garden!','post','davey',0,'2023-03-21 00:05:33','2023-03-21 00:05:33'),(122,72,'Hiya Frodo!! The weather is perfect! wanna hike or we could garden!','post','davey',0,'2023-03-28 00:15:37','2023-03-28 00:15:37'),(123,72,'OHHHH Hiya Frodo!! The weather is perfect! wanna hike or we could garden!','post','davey',0,'2023-03-28 00:15:54','2023-03-28 00:15:54');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-07-02 13:23:26
