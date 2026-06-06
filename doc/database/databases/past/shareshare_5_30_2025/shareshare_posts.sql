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
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `post_id` int unsigned NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) DEFAULT 'kite',
  `post_type` varchar(255) DEFAULT 'none',
  `post_status` int NOT NULL DEFAULT '1',
  `group_id` int NOT NULL DEFAULT '0',
  `list_id` int DEFAULT '0',
  `post_from` varchar(255) NOT NULL DEFAULT 'empty',
  `post_to` varchar(2083) NOT NULL DEFAULT 'empty',
  `post_caption` varchar(255) DEFAULT 'emp',
  `file_name` varchar(255) DEFAULT '',
  `file_name_server` varchar(255) DEFAULT 'hiya.jpg',
  `file_url` varchar(255) DEFAULT 'empty',
  `cloud_key` varchar(255) DEFAULT 'no_cloud_key',
  `cloud_bucket` varchar(255) DEFAULT 'no_cloud_bucket',
  `storage_type` varchar(255) DEFAULT 'local',
  `video_url` varchar(255) DEFAULT 'empty',
  `video_code` varchar(255) DEFAULT 'empty',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=729 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (722,'kite','text',1,72,0,'davey','frodo','The weather is perfect! wanna hike or we could garden!','no_file.jpg','hiya.jpg','empty','no_cloud_key','no_cloud_bucket','local','empty','empty','2025-03-14 23:22:20','2025-03-14 23:22:20'),(728,'kite','photo',1,72,0,'davey','72','Hiya wanna garden! ','124592282_p0.jpg','postImage-1748473597340-776483183-124592282_p0.jpg','http://localhost:3003/kite-posts-us-west-two/postImage-1748473597340-776483183-124592282_p0.jpg','no_cloud_key','kite-posts-us-west-two','local','empty','empty','2025-05-28 23:06:37','2025-05-28 23:06:37');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
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
