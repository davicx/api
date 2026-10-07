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
) ENGINE=InnoDB AUTO_INCREMENT=2477 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (2460,'kite',0,0,0,'pippin','davey','friend_request','pippin added you as a friend!','2023-06-12 00:02:11','req.body.notificationLink',0,0),(2461,'kite',0,0,0,'davey','sam','friend_request','davey added you as a friend!','2023-06-12 00:02:16','req.body.notificationLink',0,0),(2462,'kite',0,0,0,'davey','merry','friend_request','davey added you as a friend!','2023-06-12 00:02:20','req.body.notificationLink',0,0),(2463,'kite',519,0,0,'davey','merry','group_invite','Invited you to a new Group','2023-06-14 23:49:23','http://localhost:3003/group/77',0,0),(2464,'kite',519,0,0,'davey','sam','group_invite','Invited you to a new Group','2023-06-14 23:49:23','http://localhost:3003/group/77',0,0),(2465,'kite',519,0,0,'davey','frodo','group_invite','Invited you to a new Group','2023-06-14 23:49:23','http://localhost:3003/group/77',0,0),(2466,'kite',520,0,0,'davey','sam','group_invite','Invited you to a new Group','2023-06-14 23:51:50','http://localhost:3003/group/77',0,0),(2467,'kite',520,0,0,'davey','frodo','group_invite','Invited you to a new Group','2023-06-14 23:51:50','http://localhost:3003/group/77',0,0),(2468,'kite',520,0,0,'davey','merry','group_invite','Invited you to a new Group','2023-06-14 23:51:50','http://localhost:3003/group/77',0,0),(2469,'kite',521,0,0,'davey','sam','group_invite','Invited you to a new Group','2023-06-14 23:52:06','http://localhost:3003/group/77',0,0),(2470,'kite',521,0,0,'davey','frodo','group_invite','Invited you to a new Group','2023-06-14 23:52:06','http://localhost:3003/group/77',0,0),(2471,'kite',521,0,0,'davey','merry','group_invite','Invited you to a new Group','2023-06-14 23:52:06','http://localhost:3003/group/77',0,0),(2472,'kite',0,0,0,'frodo','davey','friend_request','frodo added you as a friend!','2023-06-15 00:15:16','req.body.notificationLink',0,0),(2473,'kite',0,0,0,'davey','frodo2','friend_request','davey added you as a friend!','2023-06-18 00:26:29','req.body.notificationLink',0,0),(2474,'kite',0,0,0,'frodo3','davey','friend_request','frodo3 added you as a friend!','2023-06-18 00:26:47','req.body.notificationLink',0,0),(2475,'kite',0,0,0,'davey','pippin','friend_request','davey accepted your friend request!','2023-06-18 00:30:43','req.body.notificationLink',0,0),(2476,'kite',0,0,0,'davey','pippin','friend_request','davey accepted your friend request!','2023-06-18 00:31:25','req.body.notificationLink',0,0);
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

-- Dump completed on 2023-07-02 13:23:23
