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
-- Table structure for table `notifications_original`
--

DROP TABLE IF EXISTS `notifications_original`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications_original` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `status_unseen` int NOT NULL,
  `notification_from` varchar(255) NOT NULL,
  `notification_to` varchar(255) NOT NULL,
  `notification_type` varchar(255) NOT NULL,
  `notification_message` varchar(255) NOT NULL,
  `notification_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE CURRENT_TIMESTAMP,
  `full_link` varchar(255) NOT NULL,
  `link_url` varchar(255) NOT NULL,
  `group_id` int NOT NULL,
  `list_id` int NOT NULL,
  `from_logged_in_user` int NOT NULL,
  `notification_count` int NOT NULL,
  `notification_deleted` int NOT NULL,
  `clicked` int NOT NULL,
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1622 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications_original`
--

LOCK TABLES `notifications_original` WRITE;
/*!40000 ALTER TABLE `notifications_original` DISABLE KEYS */;
INSERT INTO `notifications_original` VALUES (1587,'shareshare',1,'vasquezd','matt','group_discussion','added to a group discussion ','2019-08-23 22:57:18','groups_discussion.php?group_id=MzIx','groups_discussion.php?group_id=MzIx',321,0,0,7,0,0),(1614,'shareshare',1,'vasquezd','Kristen','new_post_photo','shared a photo','2019-08-21 19:55:27','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1615,'shareshare',1,'vasquezd','Becca','new_post_photo','shared a photo','2019-08-21 19:55:27','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1616,'shareshare',1,'vasquezd','matt','new_post_video','shared a video','2019-08-23 22:56:30','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1617,'shareshare',1,'vasquezd','Kristen','new_post_video','shared a video','2019-08-23 22:56:30','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1618,'shareshare',1,'vasquezd','Becca','new_post_video','shared a video','2019-08-23 22:56:30','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1619,'shareshare',1,'vasquezd','matt','new_post_photo','shared a photo','2019-08-23 22:56:50','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1620,'shareshare',1,'vasquezd','Kristen','new_post_photo','shared a photo','2019-08-23 22:56:50','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0),(1621,'shareshare',1,'vasquezd','Becca','new_post_photo','shared a photo','2019-08-23 22:56:50','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx','http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx',321,0,0,1,0,0);
/*!40000 ALTER TABLE `notifications_original` ENABLE KEYS */;
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
