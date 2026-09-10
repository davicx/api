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
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `post_like_id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `liked_by` int NOT NULL,
  `liked_by_name` varchar(255) NOT NULL,
  `time_stamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (92,70,1,'sam','2023-02-21 00:30:19'),(93,72,1,'sam','2023-02-21 00:42:33'),(95,72,1,'bilbo','2023-02-21 00:42:43'),(96,72,1,'frodo','2023-02-21 00:42:47'),(166,70,1,'davey','2023-03-05 00:49:45'),(167,353,1,'davey','2023-03-12 23:48:54'),(169,366,1,'davey','2023-03-18 22:18:59'),(172,367,1,'davey','2023-03-18 22:55:42'),(178,368,1,'davey','2023-03-19 23:50:31'),(181,413,1,'davey','2023-03-28 00:02:06'),(183,414,1,'davey','2023-03-28 00:11:08'),(186,72,1,'davey','2023-07-31 00:41:41'),(188,420,1,'davey','2023-08-18 23:52:27'),(189,421,1,'sam','2023-08-18 23:53:17'),(190,421,1,'merry','2023-08-18 23:53:22'),(191,421,1,'davey','2023-09-10 23:58:42'),(194,522,1,'davey','2023-10-30 00:06:01'),(196,533,1,'davey','2023-11-04 23:10:57'),(197,530,1,'davey','2023-11-04 23:12:30'),(199,537,1,'davey','2023-11-13 00:56:44'),(201,538,1,'davey','2023-11-19 00:36:32'),(203,540,1,'davey','2024-03-04 00:44:18'),(204,545,1,'davey','2024-04-28 22:54:53'),(205,612,1,'merry','2024-05-13 22:55:28'),(206,611,1,'merry','2024-05-13 22:55:33'),(207,611,1,'sam','2024-05-13 22:55:37'),(208,612,1,'sam','2024-05-13 22:55:40'),(209,612,1,'frodo','2024-05-13 22:55:44'),(210,612,1,'davey','2024-05-13 22:59:48'),(211,615,1,'davey','2024-05-25 23:29:17'),(212,615,1,'sam','2024-05-25 23:29:21'),(213,615,1,'merry','2024-05-25 23:29:24'),(214,678,1,'merry','2024-06-20 00:39:24'),(215,678,1,'pippin','2024-06-20 00:40:20');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-22 15:40:32
