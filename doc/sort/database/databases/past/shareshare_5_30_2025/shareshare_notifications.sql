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
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `group_id` int NOT NULL DEFAULT '0',
  `post_id` int NOT NULL DEFAULT '0',
  `comment_id` int NOT NULL DEFAULT '0',
  `notification_from` varchar(255) NOT NULL,
  `notification_to` varchar(255) NOT NULL,
  `notification_type` varchar(255) NOT NULL,
  `notification_message` varchar(255) NOT NULL,
  `notification_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notification_link` varchar(255) NOT NULL,
  `notification_seen` int NOT NULL DEFAULT '0',
  `notification_deleted` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3568 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (3538,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 22:42:45','',0,0),(3539,'kite',0,0,0,'davey','merry','follow','davey started following you!','2025-05-25 22:42:50','',0,0),(3540,'kite',0,0,0,'merry','davey','follow','merry started following you!','2025-05-25 22:42:55','',0,0),(3541,'kite',0,0,0,'frodo','davey','follow','frodo started following you!','2025-05-25 22:42:58','',0,0),(3542,'kite',0,0,0,'pippin','davey','follow','pippin started following you!','2025-05-25 22:43:01','',0,0),(3543,'kite',0,0,0,'frodo','pippin','follow','frodo started following you!','2025-05-25 23:06:29','',0,0),(3544,'kite',0,0,0,'frodo','merry','follow','frodo started following you!','2025-05-25 23:06:52','',0,0),(3545,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:18:16','',0,0),(3546,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:20:15','',0,0),(3547,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:23:13','',0,0),(3548,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:24:20','',0,0),(3549,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:24:28','',0,0),(3550,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:24:53','',0,0),(3551,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:25:12','',0,0),(3552,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:25:41','',0,0),(3553,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:25:51','',0,0),(3554,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:26:28','',0,0),(3555,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:28:33','',0,0),(3556,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:29:32','',0,0),(3557,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:30:15','',0,0),(3558,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:30:40','',0,0),(3559,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:31:06','',0,0),(3560,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-25 23:31:17','',0,0),(3561,'kite',0,0,0,'davey','frodo','follow','davey started following you!','2025-05-26 22:44:31','',0,0),(3562,'kite',0,0,0,'davey','merry','friend_request','davey added you as a friend!','2025-05-26 22:49:37','req.body.notificationLink',0,0),(3563,'kite',0,0,0,'merry','pippin','friend_request','merry added you as a friend!','2025-05-26 22:58:10','req.body.notificationLink',0,0),(3564,'kite',0,0,0,'davey','pippin','friend_request','davey added you as a friend!','2025-05-27 23:16:15','req.body.notificationLink',0,0),(3565,'kite',0,0,0,'frodo','davey','friend_request','frodo added you as a friend!','2025-05-27 23:22:51','req.body.notificationLink',0,0),(3566,'kite',72,0,0,'davey','sam','new_post_photo','Posted a Photo','2025-05-28 23:06:37','http://localhost:3003/posts/group/70',0,0),(3567,'kite',72,0,0,'davey','frodo','new_post_photo','Posted a Photo','2025-05-28 23:06:37','http://localhost:3003/posts/group/70',0,0);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-30 16:22:05
