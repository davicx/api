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
-- Table structure for table `pending_requests`
--

DROP TABLE IF EXISTS `pending_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `request_type` varchar(255) NOT NULL,
  `request_type_text` varchar(255) NOT NULL,
  `request_is_pending` int NOT NULL,
  `sent_by` varchar(255) NOT NULL,
  `sent_to` varchar(255) NOT NULL,
  `request_key` varchar(255) NOT NULL DEFAULT 'key',
  `sent_to_email` varchar(255) NOT NULL DEFAULT 'false',
  `friend_id` int NOT NULL DEFAULT '0',
  `group_id` int NOT NULL DEFAULT '0',
  `list_id` int NOT NULL DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1182 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_requests`
--

LOCK TABLES `pending_requests` WRITE;
/*!40000 ALTER TABLE `pending_requests` DISABLE KEYS */;
INSERT INTO `pending_requests` VALUES (1167,'kite','friend_request','pippin invited you to be friends',0,'pippin','davey','key','false',0,0,0,'2023-06-12 00:02:11','2023-06-12 00:02:11'),(1168,'kite','friend_request','davey invited you to be friends',1,'davey','sam','key','false',0,0,0,'2023-06-12 00:02:16','2023-06-12 00:02:16'),(1169,'kite','friend_request','davey invited you to be friends',1,'davey','merry','key','false',0,0,0,'2023-06-12 00:02:20','2023-06-12 00:02:20'),(1170,'kite','new_group','invited you to join a group',1,'davey','merry','key','false',0,519,0,'2023-06-14 23:49:23','2023-06-14 23:49:23'),(1171,'kite','new_group','invited you to join a group',0,'davey','sam','key','false',0,519,0,'2023-06-14 23:49:23','2023-06-14 23:49:23'),(1172,'kite','new_group','invited you to join a group',1,'davey','frodo','key','false',0,519,0,'2023-06-14 23:49:23','2023-06-14 23:49:23'),(1173,'kite','new_group','invited you to join a group',1,'davey','merry','key','false',0,520,0,'2023-06-14 23:51:50','2023-06-14 23:51:50'),(1174,'kite','new_group','invited you to join a group',0,'davey','sam','key','false',0,520,0,'2023-06-14 23:51:50','2023-06-14 23:51:50'),(1175,'kite','new_group','invited you to join a group',1,'davey','frodo','key','false',0,520,0,'2023-06-14 23:51:50','2023-06-14 23:51:50'),(1176,'kite','new_group','invited you to join a group',1,'davey','merry','key','false',0,521,0,'2023-06-14 23:52:06','2023-06-14 23:52:06'),(1177,'kite','new_group','invited you to join a group',1,'davey','frodo','key','false',0,521,0,'2023-06-14 23:52:06','2023-06-14 23:52:06'),(1178,'kite','new_group','invited you to join a group',0,'davey','sam','key','false',0,521,0,'2023-06-14 23:52:06','2023-06-14 23:52:06'),(1179,'kite','friend_request','frodo invited you to be friends',1,'frodo','davey','key','false',0,0,0,'2023-06-15 00:15:16','2023-06-15 00:15:16'),(1180,'kite','friend_request','davey invited you to be friends',1,'davey','frodo2','key','false',0,0,0,'2023-06-18 00:26:29','2023-06-18 00:26:29'),(1181,'kite','friend_request','frodo3 invited you to be friends',1,'frodo3','davey','key','false',0,0,0,'2023-06-18 00:26:47','2023-06-18 00:26:47');
/*!40000 ALTER TABLE `pending_requests` ENABLE KEYS */;
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
