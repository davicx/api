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
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `file_id` int NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `parent_folder` int NOT NULL,
  `current_folder` int NOT NULL,
  `group_id` int NOT NULL,
  `post_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_image` varchar(255) NOT NULL,
  `file_extension` varchar(255) NOT NULL,
  `file_name_server` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `file_caption` text NOT NULL,
  `file_seen` int NOT NULL,
  `file_status` int NOT NULL,
  `recycle_status` int NOT NULL,
  `unique_id` varchar(255) NOT NULL,
  `file_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `file_last_modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
INSERT INTO `files` VALUES (165,'shareshare',0,0,321,0,'background_4','1559690179background_4.png','png','1559690179background_4.png','vasquezd',1,'',0,1,0,'','2019-06-04 23:16:19','2019-06-04 23:16:19'),(166,'shareshare',0,0,321,0,'background_1','1559690242background_1.jpg','jpg','1559690242background_1.jpg','vasquezd',1,'',0,1,0,'','2019-06-04 23:17:22','2019-06-04 23:17:22'),(167,'shareshare',0,0,321,0,'background_1','1559690262background_1.jpg','jpg','1559690262background_1.jpg','vasquezd',1,'',0,1,0,'','2019-06-04 23:17:42','2019-06-04 23:17:42'),(168,'shareshare',0,0,321,0,'background_8','1559690316background_8.jpg','jpg','1559690316background_8.jpg','vasquezd',1,'',0,1,0,'','2019-06-04 23:18:36','2019-06-04 23:18:36'),(169,'shareshare',0,0,321,0,'background_4','1559690321background_4.png','png','1559690321background_4.png','vasquezd',1,'',0,1,0,'','2019-06-04 23:18:41','2019-06-04 23:18:41'),(170,'shareshare',0,0,321,0,'background_1','1559690814background_1.jpg','jpg','1559690814background_1.jpg','vasquezd',1,'',0,1,0,'','2019-06-04 23:26:54','2019-06-04 23:26:54'),(171,'shareshare',0,0,321,0,'background_6','1559690818background_6.jpg','jpg','1559690818background_6.jpg','vasquezd',1,'',0,1,0,'','2019-06-04 23:26:58','2019-06-04 23:26:58'),(172,'shareshare',0,0,321,0,'Dh1XlFBWAAAIYpL','1565899185Dh1XlFBWAAAIYpL.jpg','jpg','1565899185Dh1XlFBWAAAIYpL.jpg','vasquezd',1,'this file has a caption',0,0,1,'','2019-08-15 19:59:45','2019-08-16 22:09:36'),(173,'shareshare',0,0,321,0,'1ZmrLjK','15659018281ZmrLjK.jpg','jpg','15659018281ZmrLjK.jpg','vasquezd',1,'oya',0,0,1,'','2019-08-15 20:43:48','2019-08-16 22:09:40'),(174,'shareshare',0,0,321,0,'178bb1f55eb53b53512165915b540362','1565993383178bb1f55eb53b53512165915b540362.jpg','jpg','1565993383178bb1f55eb53b53512165915b540362.jpg','vasquezd',1,'',0,0,1,'','2019-08-16 22:09:43','2019-08-20 20:12:02'),(175,'shareshare',0,0,321,0,'resize','1565993973resize.jpg','jpg','1565993973resize.jpg','vasquezd',1,'hiya',0,1,0,'','2019-08-16 22:19:33','2019-08-16 22:19:33');
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-07-02 13:23:25
