-- MySQL dump 10.13  Distrib 8.0.43, for macos15 (arm64)
--
-- Host: localhost    Database: shareshare
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `comment_likes`
--

DROP TABLE IF EXISTS `comment_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_likes` (
  `comment_like_id` int NOT NULL AUTO_INCREMENT,
  `comment_id` int NOT NULL,
  `liked_by` int NOT NULL,
  `liked_by_name` varchar(255) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_likes`
--

LOCK TABLES `comment_likes` WRITE;
/*!40000 ALTER TABLE `comment_likes` DISABLE KEYS */;
INSERT INTO `comment_likes` VALUES (142,216,1,'frodo','2025-05-06 23:42:14'),(145,231,1,'frodo','2025-05-07 23:06:30'),(182,232,1,'davey','2025-05-10 23:06:37'),(186,229,1,'merry','2025-05-11 23:17:13'),(187,229,1,'pippin','2025-05-11 23:19:57'),(230,230,1,'davey','2025-05-14 23:28:38'),(231,233,1,'davey','2025-05-14 23:28:39'),(248,234,1,'davey','2025-06-08 23:43:31'),(249,229,1,'davey','2025-07-09 23:43:57'),(250,242,1,'pippin','2025-09-24 23:07:26');
/*!40000 ALTER TABLE `comment_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comment_votes`
--

DROP TABLE IF EXISTS `comment_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment_votes` (
  `comment_vote_id` int NOT NULL AUTO_INCREMENT,
  `comment_id` int NOT NULL,
  `up_vote` int NOT NULL,
  `up_vote_user` varchar(255) NOT NULL,
  `down_vote` int NOT NULL,
  `down_vote_user` varchar(255) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_vote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comment_votes`
--

LOCK TABLES `comment_votes` WRITE;
/*!40000 ALTER TABLE `comment_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `comment_votes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `comment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL DEFAULT '0',
  `group_id` int NOT NULL DEFAULT '0',
  `list_id` int NOT NULL DEFAULT '0',
  `comment` text,
  `comment_type` varchar(256) NOT NULL DEFAULT 'post',
  `comment_from` varchar(255) NOT NULL DEFAULT '',
  `comment_deleted` int NOT NULL DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=249 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (229,790,72,0,'He loved mountains, or he had loved the thought of them marching on the edge of stories brought from far away; but now he was borne down by the insupportable weight of Middle-earth. He longed to shut out the immensity in a quiet room by a fire.','post','davey',0,'2025-08-03 23:32:37','2025-05-06 23:23:02'),(234,790,72,12,'He loved mountains.','post','davey',0,'2025-08-03 23:32:43','2025-05-17 23:12:54'),(235,790,72,12,'The leaves were long, the grass was green,\nThe hemlock-umbels tall and fair,\nAnd in the glade a light was seen\nOf stars in shadow shimmering.\nTinuviel was dancing there\nTo music of a pipe unseen,\nAnd light of stars was in her hair,\nAnd in her raiment glimmering','post','davey',0,'2025-08-03 23:32:47','2025-07-22 23:44:15'),(236,791,72,12,'The leaves were long, the grass was green,\nThe hemlock-umbels tall and fair,\nAnd in the glade a light was seen\nOf stars in shadow shimmering.','post','davey',0,'2025-08-03 23:32:55','2025-07-22 23:44:15'),(237,791,72,12,'The hemlock-umbels tall and fair, And in the glade a light was seen Of stars in shadow shimmering. The hemlock-umbels tall and fair, And in the glade a light was seen Of stars in shadow shimmering.user_profile','post','davey',0,'2025-08-03 23:33:05','2025-07-22 23:44:16'),(238,796,72,0,'He loved mountains too lets go on a hike!!','post','davey',0,'2025-08-22 23:00:11','2025-08-22 23:00:11'),(239,796,72,0,'Good Morning! said Bilbo, and he meant it. The sun was shining, and the grass was very green. But Gandalf looked at him from under long bushy eyebrows that stuck out further than the brim of his shady hat.','post','davey',0,'2025-08-22 23:01:20','2025-08-22 23:01:20'),(240,723,723,0,'He loved mountains too lets go on a hike!!','post','davey',0,'2025-09-24 23:06:38','2025-09-24 23:06:38'),(241,723,723,0,'He loved mountains too lets go on a hike!!','post','davey',0,'2025-09-24 23:06:53','2025-09-24 23:06:53'),(242,797,723,0,'He loved mountains too lets go on a hike!!','post','davey',0,'2025-09-24 23:07:08','2025-09-24 23:07:08'),(243,832,723,0,'He loved mountains too lets go on a hike!!','post','davey',0,'2025-12-16 00:17:09','2025-12-16 00:17:09'),(244,836,723,0,'It is a great day for a Hike!!','post','sam',0,'2026-02-24 00:43:23','2026-02-24 00:43:23'),(245,836,723,0,'I know I want to go!!','post','sam',0,'2026-02-24 00:43:34','2026-02-24 00:43:34'),(246,836,723,0,'I know I want to go!!','post','sam',0,'2026-02-24 00:43:41','2026-02-24 00:43:41'),(247,836,723,0,'Me too!','post','merry',0,'2026-02-24 00:43:50','2026-02-24 00:43:50'),(248,832,72,0,'Want to go to the greenwater inn after we fish?!','post','merry',0,'2026-03-18 23:52:56','2026-03-18 23:52:56');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

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

--
-- Table structure for table `following`
--

DROP TABLE IF EXISTS `following`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `following` (
  `follow_id` int NOT NULL AUTO_INCREMENT,
  `following_key` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `following_user` varchar(255) NOT NULL,
  `following_user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follow_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `following`
--

LOCK TABLES `following` WRITE;
/*!40000 ALTER TABLE `following` DISABLE KEYS */;
INSERT INTO `following` VALUES (38,'davey_frodo','davey',1,'frodo',2,'2025-05-26 22:44:31');
/*!40000 ALTER TABLE `following` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `friends_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `friend_user_name` varchar(255) NOT NULL,
  `friend_id` int NOT NULL,
  `sent_by` varchar(256) NOT NULL DEFAULT 'empty',
  `sent_to` varchar(256) NOT NULL DEFAULT 'empty',
  `request_pending` int NOT NULL,
  `friend_key` varchar(255) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`friends_id`)
) ENGINE=InnoDB AUTO_INCREMENT=971 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (955,'davey',1,'sam',8,'davey','sam',0,'davey_sam','2025-12-04 23:57:07'),(956,'sam',8,'davey',1,'davey','sam',0,'sam_davey','2025-12-04 23:57:07'),(965,'davey',1,'frodo',2,'davey','frodo',1,'davey_frodo','2025-12-05 00:11:05'),(966,'frodo',2,'davey',1,'davey','frodo',1,'frodo_davey','2025-12-05 00:11:05'),(967,'davey',1,'pippin',5,'davey','pippin',1,'davey_pippin','2025-12-05 00:11:06'),(968,'pippin',5,'davey',1,'davey','pippin',1,'pippin_davey','2025-12-05 00:11:06'),(969,'davey',1,'merry',6,'davey','merry',1,'davey_merry','2025-12-05 00:42:51'),(970,'merry',6,'davey',1,'davey','merry',1,'merry_davey','2025-12-05 00:42:51');
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_users`
--

DROP TABLE IF EXISTS `group_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_users` (
  `primary_id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `active_member` int NOT NULL,
  `group_last_visit` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_default_group` int NOT NULL DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`primary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2267 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_users`
--

LOCK TABLES `group_users` WRITE;
/*!40000 ALTER TABLE `group_users` DISABLE KEYS */;
INSERT INTO `group_users` VALUES (2039,70,'davey',1,'0000-00-00 00:00:00',0,'2025-07-05 23:52:32'),(2040,70,'sam',1,'0000-00-00 00:00:00',0,'2025-07-05 23:52:32'),(2041,70,'merry',1,'0000-00-00 00:00:00',0,'2025-07-05 23:52:32'),(2042,70,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-05 23:52:32'),(2043,70,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-05 23:52:32'),(2072,72,'merry',1,'0000-00-00 00:00:00',0,'2025-07-07 00:22:53'),(2073,72,'davey',1,'0000-00-00 00:00:00',0,'2025-07-07 00:22:53'),(2074,72,'sam',1,'0000-00-00 00:00:00',0,'2025-07-07 00:24:02'),(2096,690,'davey',1,'0000-00-00 00:00:00',0,'2025-07-18 23:36:38'),(2097,690,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-18 23:36:38'),(2098,690,'merry',1,'0000-00-00 00:00:00',0,'2025-07-18 23:36:38'),(2099,690,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-18 23:36:38'),(2100,690,'sam',1,'0000-00-00 00:00:00',0,'2025-07-18 23:36:38'),(2101,691,'sam',1,'0000-00-00 00:00:00',0,'2025-07-18 23:37:03'),(2102,691,'davey',1,'0000-00-00 00:00:00',0,'2025-07-18 23:37:03'),(2103,691,'merry',1,'0000-00-00 00:00:00',0,'2025-07-18 23:37:03'),(2104,691,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-18 23:37:03'),(2105,691,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-18 23:37:03'),(2106,692,'davey',1,'0000-00-00 00:00:00',0,'2025-07-29 23:08:56'),(2107,692,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-29 23:08:56'),(2108,692,'sam',1,'0000-00-00 00:00:00',0,'2025-07-29 23:08:56'),(2109,692,'merry',1,'0000-00-00 00:00:00',0,'2025-07-29 23:08:56'),(2110,692,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-29 23:08:56'),(2111,693,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:00'),(2112,693,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:00'),(2113,693,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:00'),(2114,693,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:00'),(2115,693,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:00'),(2116,694,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:21'),(2117,694,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:21'),(2118,694,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:21'),(2119,694,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:21'),(2120,694,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 00:00:21'),(2121,695,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:25:55'),(2122,695,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:25:55'),(2123,695,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:25:55'),(2124,695,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:25:55'),(2125,695,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:25:55'),(2126,696,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:29:41'),(2127,696,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:29:41'),(2128,696,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:29:41'),(2129,696,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:29:41'),(2130,696,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:29:41'),(2131,697,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:12'),(2132,697,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:12'),(2133,697,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:12'),(2134,697,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:12'),(2135,697,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:12'),(2136,698,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:28'),(2137,698,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:28'),(2138,698,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:28'),(2139,698,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:28'),(2140,698,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:33:28'),(2141,699,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:35:00'),(2142,699,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:35:00'),(2143,699,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:35:00'),(2144,699,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:35:00'),(2145,699,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:35:00'),(2146,700,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:36:47'),(2147,700,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:36:47'),(2148,700,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:36:47'),(2149,700,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:36:47'),(2150,700,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:36:47'),(2151,701,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:39:30'),(2152,701,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:39:30'),(2153,701,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:39:30'),(2154,701,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:39:30'),(2155,701,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:39:30'),(2156,702,'davey',1,'0000-00-00 00:00:00',0,'2025-07-30 23:40:16'),(2157,702,'sam',1,'0000-00-00 00:00:00',0,'2025-07-30 23:40:16'),(2158,702,'merry',1,'0000-00-00 00:00:00',0,'2025-07-30 23:40:16'),(2159,702,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-30 23:40:16'),(2160,702,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-30 23:40:16'),(2161,703,'davey',1,'0000-00-00 00:00:00',0,'2025-07-31 23:53:45'),(2162,703,'sam',1,'0000-00-00 00:00:00',0,'2025-07-31 23:53:45'),(2163,703,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-31 23:53:45'),(2164,703,'merry',1,'0000-00-00 00:00:00',0,'2025-07-31 23:53:45'),(2165,703,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-31 23:53:45'),(2166,704,'davey',1,'0000-00-00 00:00:00',0,'2025-07-31 23:56:08'),(2167,704,'sam',1,'0000-00-00 00:00:00',0,'2025-07-31 23:56:08'),(2168,704,'merry',1,'0000-00-00 00:00:00',0,'2025-07-31 23:56:08'),(2169,704,'pippin',1,'0000-00-00 00:00:00',0,'2025-07-31 23:56:08'),(2170,704,'frodo',1,'0000-00-00 00:00:00',0,'2025-07-31 23:56:08'),(2171,705,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:28'),(2172,705,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:28'),(2173,705,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:28'),(2174,705,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:28'),(2175,705,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:28'),(2176,706,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:47'),(2177,706,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:47'),(2178,706,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:47'),(2179,706,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:47'),(2180,706,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:47'),(2181,707,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:52'),(2182,707,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:52'),(2183,707,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:52'),(2184,707,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:52'),(2185,707,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:25:52'),(2186,708,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:27:30'),(2187,708,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:27:30'),(2188,708,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:27:30'),(2189,708,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:27:30'),(2190,708,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:27:30'),(2191,709,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:34:53'),(2192,709,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:34:53'),(2193,709,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:34:53'),(2194,709,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:34:53'),(2195,709,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:34:53'),(2196,710,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:06'),(2197,710,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:06'),(2198,710,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:06'),(2199,710,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:06'),(2200,710,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:06'),(2201,711,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:44'),(2202,711,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:44'),(2203,711,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:44'),(2204,711,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:44'),(2205,711,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:35:44'),(2206,712,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:37:19'),(2207,712,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:37:19'),(2208,712,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:37:19'),(2209,712,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:37:19'),(2210,712,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:37:19'),(2211,713,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:38:12'),(2212,713,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:38:12'),(2213,713,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:38:12'),(2214,713,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:38:12'),(2215,713,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:38:12'),(2216,714,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:39:54'),(2217,714,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:39:54'),(2218,714,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:39:54'),(2219,714,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:39:54'),(2220,714,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:39:54'),(2221,715,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:40:00'),(2222,715,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:40:00'),(2223,715,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:40:00'),(2224,715,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:40:00'),(2225,715,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:40:00'),(2226,716,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:03'),(2227,716,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:03'),(2228,716,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:03'),(2229,716,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:03'),(2230,716,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:03'),(2231,717,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:28'),(2232,717,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:28'),(2233,717,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:28'),(2234,717,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:28'),(2235,717,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:41:28'),(2236,718,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:08'),(2237,718,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:08'),(2238,718,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:08'),(2239,718,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:08'),(2240,718,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:08'),(2241,719,'davey',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:31'),(2242,719,'sam',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:31'),(2243,719,'merry',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:31'),(2244,719,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:31'),(2245,719,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-01 23:42:31'),(2246,720,'davey',1,'0000-00-00 00:00:00',0,'2025-08-03 23:41:22'),(2247,720,'sam',1,'0000-00-00 00:00:00',0,'2025-08-03 23:41:22'),(2248,720,'merry',1,'0000-00-00 00:00:00',0,'2025-08-03 23:41:22'),(2249,720,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-03 23:41:22'),(2250,720,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-03 23:41:22'),(2251,721,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-17 23:54:04'),(2252,721,'merry',1,'0000-00-00 00:00:00',0,'2025-08-17 23:54:04'),(2253,721,'sam',1,'0000-00-00 00:00:00',0,'2025-08-17 23:54:04'),(2254,721,'davey',1,'0000-00-00 00:00:00',0,'2025-08-17 23:54:04'),(2255,722,'sam',1,'0000-00-00 00:00:00',0,'2025-08-20 23:25:30'),(2256,722,'davey',1,'0000-00-00 00:00:00',0,'2025-08-20 23:25:30'),(2257,722,'merry',1,'0000-00-00 00:00:00',0,'2025-08-20 23:25:30'),(2258,722,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-20 23:25:30'),(2259,722,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-20 23:25:30'),(2260,723,'davey',1,'0000-00-00 00:00:00',0,'2025-08-20 23:32:43'),(2261,723,'sam',1,'0000-00-00 00:00:00',0,'2025-08-20 23:32:43'),(2262,723,'merry',1,'0000-00-00 00:00:00',0,'2025-08-20 23:32:43'),(2263,723,'pippin',1,'0000-00-00 00:00:00',0,'2025-08-20 23:32:43'),(2264,723,'frodo',1,'0000-00-00 00:00:00',0,'2025-08-20 23:32:43'),(2265,724,'davey',1,'0000-00-00 00:00:00',0,'2026-01-30 00:43:52'),(2266,724,'sam',0,'0000-00-00 00:00:00',0,'2026-01-30 00:43:52');
/*!40000 ALTER TABLE `group_users` ENABLE KEYS */;
UNLOCK TABLES;

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
  `file_name` varchar(255) DEFAULT NULL,
  `file_name_server` varchar(255) DEFAULT NULL,
  `cloud_key` varchar(255) DEFAULT NULL,
  `cloud_bucket` varchar(255) DEFAULT NULL,
  `storage_type` varchar(255) DEFAULT NULL,
  `group_key` varchar(255) NOT NULL DEFAULT 'nokey',
  `group_private` int NOT NULL DEFAULT '1',
  `group_deleted` int NOT NULL DEFAULT '0',
  `updated` timestamp NOT NULL DEFAULT '1995-07-20 05:06:22',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=725 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (70,'kite','davey','New Group!','the_shire.jpg','fileName','fileNameServer','cloudKey','cloudBucket','local','nokey',1,1,'1995-07-20 05:06:22','2023-11-27 00:26:27'),(72,'kite','davey','Hiking in the Shire','http://localhost:3003/kite-us-west-two/groups/groupImage-1754264482637-64076401-IMG_3737.JPG','group_image.png','groupImage-1754264482637-64076401-IMG_3737.JPG','groups/groupImage-1754264482637-64076401-IMG_3737.JPG','kite-us-west-two','local','nokey',1,1,'1995-07-20 05:06:22','2025-07-07 23:28:32'),(722,'kite','sam','Games Sam Wants','http://localhost:3003/kite-us-west-two/groups/group_image.jpg','group_image.jpg','group_image.jpg','groups/group_image.jpg','kite-us-west-two','local','nokey',1,0,'1995-07-20 05:06:22','2025-08-20 23:25:30'),(723,'kite','davey','Legos I want','http://localhost:3003/kite-us-west-two/groups/group_image.jpg','group_image.jpg','group_image.jpg','groups/group_image.jpg','kite-us-west-two','local','nokey',1,0,'1995-07-20 05:06:22','2025-08-20 23:32:43'),(724,'kite','davey','New !!','http://localhost:3003/kite-us-west-two/groups/group_image.jpg','group_image.jpg','group_image.jpg','groups/group_image.jpg','kite-us-west-two','local','nokey',1,0,'1995-07-20 05:06:22','2026-01-30 00:43:52');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_purchases`
--

DROP TABLE IF EXISTS `item_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_purchases` (
  `item_purchase_id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `post_id` int unsigned NOT NULL,
  `item_id` int unsigned NOT NULL,
  `purchased_by_username` varchar(255) NOT NULL,
  `item_for_user_name` varchar(255) NOT NULL,
  `visible_to_user_name` varchar(255) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_purchase_id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_item_id` (`item_id`),
  KEY `idx_post_id` (`post_id`),
  CONSTRAINT `fk_item_purchases_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_purchases`
--

LOCK TABLES `item_purchases` WRITE;
/*!40000 ALTER TABLE `item_purchases` DISABLE KEYS */;
INSERT INTO `item_purchases` VALUES (13,723,836,39,'sam','davey','frodo','2026-02-20 00:36:04'),(14,723,836,39,'sam','davey','bilbo','2026-02-20 00:36:04'),(15,723,831,37,'davey','davey','sam','2026-02-21 00:31:39'),(16,723,831,37,'davey','davey','frodo','2026-02-21 00:31:39'),(17,723,831,37,'davey','davey','merry','2026-02-21 00:31:39'),(18,723,831,37,'davey','davey','pippin','2026-02-21 00:31:39');
/*!40000 ALTER TABLE `item_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` int unsigned NOT NULL AUTO_INCREMENT,
  `post_id` int unsigned NOT NULL,
  `item_name` varchar(255) NOT NULL DEFAULT 'item_name',
  `item_price` decimal(10,2) DEFAULT '0.00',
  `item_description` text,
  `item_category` varchar(255) DEFAULT 'item_category',
  `item_link` varchar(2083) DEFAULT 'item_link',
  `purchased` tinyint(1) DEFAULT '0',
  `purchased_by` varchar(255) DEFAULT 'purchased_by',
  `store` varchar(255) DEFAULT 'store',
  `multiple_stores` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `post_id` (`post_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (37,831,'Final Fantasy',40.00,'I really want this cool game~! It is at a lot of stores','video games','www.chronotrigger.com',1,'davey','store',0),(38,835,'Secret of Mana!!!!',50.00,'I want to get Secret of Mana','video_games','www.secretofmana.com',0,'purchased_by','store',0),(39,836,'Secret of Mana',50.00,'I want to get Secret of Mana','video_games','www.secretofmana.com',1,'sam','store',0),(40,837,'Secret of Mana',50.00,'Sam wants to get Secret of Mana too','video_games','www.secretofmana.com',0,'','store',0),(41,839,'Secret of Mana',50.00,'So pretty!','video_games','www.secretofmana.com',0,'purchased_by','store',0),(42,840,'Secret of Mana',50.00,'So pretty!','video_games','www.secretofmana.com',0,'purchased_by','store',0);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

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
  `notification_time` varchar(255) DEFAULT NULL,
  `notification_link` varchar(255) NOT NULL,
  `notification_seen` int NOT NULL DEFAULT '0',
  `notification_deleted` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4326 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (4306,'kite',0,0,0,'davey','sam','friend_request','davey added you as a friend!',NULL,'req.body.notificationLink',0,0),(4308,'kite',0,0,0,'sam','davey','friend_request','sam accepted your friend request!',NULL,'req.body.notificationLink',0,0),(4312,'kite',0,0,0,'davey','frodo','friend_request','davey added you as a friend!',NULL,'req.body.notificationLink',0,0),(4313,'kite',0,0,0,'davey','pippin','friend_request','davey added you as a friend!',NULL,'req.body.notificationLink',0,0),(4314,'kite',0,0,0,'davey','merry','friend_request','davey added you as a friend!',NULL,'req.body.notificationLink',0,0),(4315,'kite',70,0,0,'davey','sam','new_post_photo','Posted a Photo',NULL,'http://localhost:3003/posts/group/70',0,0),(4316,'kite',70,0,0,'davey','merry','new_post_photo','Posted a Photo',NULL,'http://localhost:3003/posts/group/70',0,0),(4317,'kite',70,0,0,'davey','frodo','new_post_photo','Posted a Photo',NULL,'http://localhost:3003/posts/group/70',0,0),(4318,'kite',70,0,0,'davey','pippin','new_post_photo','Posted a Photo',NULL,'http://localhost:3003/posts/group/70',0,0),(4319,'kite',723,0,0,'davey','832','new_post_comment','Made a Comment on your Post',NULL,'http://localhost:3003/posts/group/723',0,0),(4320,'kite',724,0,0,'davey','sam','group_invite','Invited you to a new Group',NULL,'http://localhost:3003/group/77',0,0),(4321,'kite',723,0,0,'sam','836','new_post_comment','Made a Comment on your Post',NULL,'http://localhost:3003/posts/group/723',0,0),(4322,'kite',723,0,0,'sam','836','new_post_comment','Made a Comment on your Post',NULL,'http://localhost:3003/posts/group/723',0,0),(4323,'kite',723,0,0,'sam','836','new_post_comment','Made a Comment on your Post',NULL,'http://localhost:3003/posts/group/723',0,0),(4324,'kite',723,0,0,'merry','836','new_post_comment','Made a Comment on your Post',NULL,'http://localhost:3003/posts/group/723',0,0),(4325,'kite',72,0,0,'merry','832','new_post_comment','Made a Comment on your Post',NULL,'http://localhost:3003/posts/group/72',0,0);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pending_email`
--

DROP TABLE IF EXISTS `pending_email`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pending_email` (
  `primary_id` int NOT NULL AUTO_INCREMENT,
  `codehash` varchar(255) NOT NULL,
  `request_from` varchar(255) NOT NULL,
  `request_to` varchar(255) NOT NULL,
  `request_to_existing_user` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `square_id` int NOT NULL,
  `group_id` int NOT NULL,
  `list_id` int NOT NULL,
  `status` int NOT NULL,
  PRIMARY KEY (`primary_id`),
  UNIQUE KEY `codehash` (`codehash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_email`
--

LOCK TABLES `pending_email` WRITE;
/*!40000 ALTER TABLE `pending_email` DISABLE KEYS */;
/*!40000 ALTER TABLE `pending_email` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=2007 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pending_requests`
--

LOCK TABLES `pending_requests` WRITE;
/*!40000 ALTER TABLE `pending_requests` DISABLE KEYS */;
INSERT INTO `pending_requests` VALUES (1998,'kite','friend_request','davey invited you to be friends',0,'davey','sam','key','false',0,0,0,'2025-12-04 00:58:15','2025-12-04 00:58:15'),(2003,'kite','friend_request','davey invited you to be friends',1,'davey','frodo','key','false',0,0,0,'2025-12-05 00:11:05','2025-12-05 00:11:05'),(2004,'kite','friend_request','davey invited you to be friends',1,'davey','pippin','key','false',0,0,0,'2025-12-05 00:11:06','2025-12-05 00:11:06'),(2005,'kite','friend_request','davey invited you to be friends',1,'davey','merry','key','false',0,0,0,'2025-12-05 00:42:51','2025-12-05 00:42:51'),(2006,'kite','new_group','invited you to join a group',1,'davey','sam','key','false',0,724,0,'2026-01-30 00:43:52','2026-01-30 00:43:52');
/*!40000 ALTER TABLE `pending_requests` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=435 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (92,70,1,'sam','2023-02-21 00:30:19'),(93,72,1,'sam','2023-02-21 00:42:33'),(95,72,1,'bilbo','2023-02-21 00:42:43'),(96,72,1,'frodo','2023-02-21 00:42:47'),(166,70,1,'davey','2023-03-05 00:49:45'),(167,353,1,'davey','2023-03-12 23:48:54'),(169,366,1,'davey','2023-03-18 22:18:59'),(172,367,1,'davey','2023-03-18 22:55:42'),(178,368,1,'davey','2023-03-19 23:50:31'),(181,413,1,'davey','2023-03-28 00:02:06'),(183,414,1,'davey','2023-03-28 00:11:08'),(186,72,1,'davey','2023-07-31 00:41:41'),(188,420,1,'davey','2023-08-18 23:52:27'),(189,421,1,'sam','2023-08-18 23:53:17'),(190,421,1,'merry','2023-08-18 23:53:22'),(191,421,1,'davey','2023-09-10 23:58:42'),(194,522,1,'davey','2023-10-30 00:06:01'),(196,533,1,'davey','2023-11-04 23:10:57'),(197,530,1,'davey','2023-11-04 23:12:30'),(199,537,1,'davey','2023-11-13 00:56:44'),(201,538,1,'davey','2023-11-19 00:36:32'),(203,540,1,'davey','2024-03-04 00:44:18'),(204,545,1,'davey','2024-04-28 22:54:53'),(205,612,1,'merry','2024-05-13 22:55:28'),(206,611,1,'merry','2024-05-13 22:55:33'),(207,611,1,'sam','2024-05-13 22:55:37'),(208,612,1,'sam','2024-05-13 22:55:40'),(209,612,1,'frodo','2024-05-13 22:55:44'),(210,612,1,'davey','2024-05-13 22:59:48'),(211,615,1,'davey','2024-05-25 23:29:17'),(212,615,1,'sam','2024-05-25 23:29:21'),(213,615,1,'merry','2024-05-25 23:29:24'),(214,678,1,'merry','2024-06-20 00:39:24'),(215,678,1,'pippin','2024-06-20 00:40:20'),(216,693,1,'davey','2025-02-22 00:14:27'),(217,698,1,'davey','2025-02-25 23:12:31'),(219,718,2,'frodo','2025-04-08 23:33:27'),(220,722,2,'frodo','2025-04-08 23:36:10'),(222,722,0,'sam','2025-04-08 23:36:17'),(223,722,0,'james','2025-04-09 23:18:04'),(289,720,1,'davey','2025-04-22 22:21:55'),(346,0,1,'davey','2025-05-26 23:30:11'),(367,728,1,'davey','2025-07-09 23:43:00'),(372,730,1,'davey','2025-07-09 23:58:53'),(373,729,1,'davey','2025-07-10 23:51:32'),(374,760,1,'davey','2025-07-14 00:38:48'),(375,722,1,'davey','2025-07-18 23:57:51'),(381,793,1,'davey','2025-08-17 00:21:21'),(384,797,1,'davey','2025-09-24 23:06:10'),(385,797,8,'sam','2025-09-24 23:06:14'),(397,832,2,'frodo','2026-01-06 00:20:14'),(398,832,6,'merry','2026-01-06 00:20:20'),(399,832,8,'sam','2026-01-06 00:20:25'),(429,837,1,'davey','2026-01-31 00:47:49'),(430,836,1,'davey','2026-02-19 00:03:44'),(433,832,1,'davey','2026-03-18 00:06:07'),(434,796,1,'davey','2026-03-18 00:08:20');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB AUTO_INCREMENT=841 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (790,'kite','photo',1,72,0,'davey','72','Hiya wanna garden! Hiya wanna garden! Hiya wanna garden! Hiya wanna garden! The weather is perfect! wanna hike or we could garden! The mountains look lovely too!!!','76909388_p0.jpg','postImage-1754263842395-933616450-76909388_p0.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1754263842395-933616450-76909388_p0.jpg','posts/postImage-1754263842395-933616450-76909388_p0.jpg','kite-us-west-two','local','empty','empty','2025-08-03 23:30:42','2025-08-03 23:30:42'),(791,'kite','photo',1,72,0,'davey','72','The weather is perfect! wanna hike or we could garden! The mountains look lovely too!!!','15973568985_centimeters_per_second_by_snatti89_ddozyl8-fullview.jpg','postImage-1754263858643-28370144-15973568985_centimeters_per_second_by_snatti89_ddozyl8-fullview.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1754263858643-28370144-15973568985_centimeters_per_second_by_snatti89_ddozyl8-fullview.jpg','posts/postImage-1754263858643-28370144-15973568985_centimeters_per_second_by_snatti89_ddozyl8-fullview.jpg','kite-us-west-two','local','empty','empty','2025-08-03 23:30:58','2025-08-03 23:30:58'),(793,'kite','photo',1,72,0,'merry','72','Hiya wanna garden! ','background_2.png','postImage-1754611494744-315125123-background_2.png','http://localhost:3003/kite-us-west-two/posts/postImage-1754611494744-315125123-background_2.png','posts/postImage-1754611494744-315125123-background_2.png','kite-us-west-two','local','empty','empty','2025-08-08 00:04:54','2025-08-08 00:04:54'),(796,'kite','photo',1,72,0,'davey','72','Hiya wanna garden! ','background_2.png','postImage-1755733139053-403626514-background_2.png','http://localhost:3003/kite-us-west-two/posts/postImage-1755733139053-403626514-background_2.png','posts/postImage-1755733139053-403626514-background_2.png','kite-us-west-two','local','empty','empty','2025-08-20 23:38:59','2025-08-20 23:38:59'),(831,'kite','item',1,723,0,'davey','723','I like this game for a gift!!','ff_tactics.jpg','postImage-1760223872278-186100521-ff_tactics.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1760223872278-186100521-ff_tactics.jpg','posts/postImage-1760223872278-186100521-ff_tactics.jpg','kite-us-west-two','local','empty','empty','2025-10-11 23:04:32','2025-10-11 23:04:32'),(832,'kite','photo',1,72,0,'davey','72','Hiya wanna garden! ','background_20.png','postImage-1760309973132-341816001-background_20.png','http://localhost:3003/kite-us-west-two/posts/postImage-1760309973132-341816001-background_20.png','posts/postImage-1760309973132-341816001-background_20.png','kite-us-west-two','local','empty','empty','2025-10-12 22:59:33','2025-10-12 22:59:33'),(833,'kite','photo',1,70,0,'davey','70','Hiya wanna garden! ','64600482_p0.jpg','postImage-1760310166580-140619225-64600482_p0.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1760310166580-140619225-64600482_p0.jpg','posts/postImage-1760310166580-140619225-64600482_p0.jpg','kite-us-west-two','local','empty','empty','2025-10-12 23:02:46','2025-10-12 23:02:46'),(834,'kite','photo',1,70,0,'davey','70','Hiya wanna garden! ','64600482_p0.jpg','postImage-1760310219636-758511491-64600482_p0.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1760310219636-758511491-64600482_p0.jpg','posts/postImage-1760310219636-758511491-64600482_p0.jpg','kite-us-west-two','local','empty','empty','2025-10-12 23:03:39','2025-10-12 23:03:39'),(835,'wishlist','item',1,0,0,'davey','0','I want to get Secret of Mana','image.jpg','postImage-1760831909511-689868858-image.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1760831909511-689868858-image.jpg','posts/postImage-1760831909511-689868858-image.jpg','kite-us-west-two','local','empty','empty','2025-10-18 23:58:29','2025-10-18 23:58:29'),(836,'wishlist','item',1,723,0,'davey','723','I want to get Secret of Mana','image.jpg','postImage-1760832137463-28996287-image.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1760832137463-28996287-image.jpg','posts/postImage-1760832137463-28996287-image.jpg','kite-us-west-two','local','empty','empty','2025-10-19 00:02:17','2025-10-19 00:02:17'),(837,'wishlist','item',1,722,0,'Sam','722','Sam wants to get Secret of Mana too','image.jpg','postImage-1760917138605-23559525-image.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1760917138605-23559525-image.jpg','posts/postImage-1760917138605-23559525-image.jpg','kite-us-west-two','local','empty','empty','2025-10-19 23:38:58','2025-10-19 23:38:58'),(838,'kite','photo',1,70,0,'davey','70','Hiya wanna garden! ','64600482_p0.jpg','postImage-1765497404324-133739022-64600482_p0.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1765497404324-133739022-64600482_p0.jpg','posts/postImage-1765497404324-133739022-64600482_p0.jpg','kite-us-west-two','local','empty','empty','2025-12-11 23:56:44','2025-12-11 23:56:44'),(839,'wishlist','item',1,0,0,'davey','0','So pretty!','image.jpg','postImage-1768609554421-679199539-image.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1768609554421-679199539-image.jpg','posts/postImage-1768609554421-679199539-image.jpg','kite-us-west-two','local','empty','empty','2026-01-17 00:25:54','2026-01-17 00:25:54'),(840,'wishlist','item',1,0,0,'davey','0','So pretty!','image.jpg','postImage-1768609568609-360136537-image.jpg','http://localhost:3003/kite-us-west-two/posts/postImage-1768609568609-360136537-image.jpg','posts/postImage-1768609568609-360136537-image.jpg','kite-us-west-two','local','empty','empty','2026-01-17 00:26:08','2026-01-17 00:26:08');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `device_id` varchar(255) NOT NULL DEFAULT 'device_id',
  `token_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1090 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (151,'temp2','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InRlbXAyIiwiaWF0IjoxNjc3OTc3MTM0fQ.UF8Jw2mWK37wN2RdDqZZV-Cq0ANH7Sfe3SA6w_JhIfc','device_id','2023-03-05 00:45:34'),(150,'temp','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InRlbXAiLCJpYXQiOjE2Nzc5NzcwNzd9.ZCD-sLcj34gNWIWugRbkT_tC7SGawStNSXXn_fxUm6o','device_id','2023-03-05 00:44:37'),(149,'temp','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InRlbXAiLCJpYXQiOjE2Nzc5NzcwMTB9.nvPfNb0tGhv3dZjxGztf-39ChhlBe2zU-FDLhQfkazI','device_id','2023-03-05 00:43:30'),(386,'sam','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InNhbSIsImlhdCI6MTcwNDE1Mzg5OX0.6Dcp5XckKPCtZLmilwVyFSRlv8aYidwsfyqrBx4i5NA','device_id','2024-01-02 00:04:59'),(331,'frodo3','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImZyb2RvMyIsImlhdCI6MTY5MzcwMTY3Mn0.7hte-h3lgwo8ggccPTbNLgwBoWEvptXv7HxiBQDwFt8','device_id','2023-09-03 00:41:12'),(1088,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzczODc1NTU4fQ.eDOv2uW70qkiXsytJrA171F6W21iD2XRkqWfSE7QMug','davey_postman','2026-03-18 23:12:38'),(979,'Sam','8','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6IlNhbSIsImlhdCI6MTc2MDkxNzAxNn0.pXIQcCxFGIasawB8C9vn_bQSXRAFAELgIt4WzAOK4ms','7697E4AA-E507-405C-9524-93A013845131','2025-10-19 23:36:56'),(581,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzQyODU4OTIzfQ.I8Fwo2Y1WP3uaGa0kaV1d7t5zvCYYoJ3aYKPfhUntbM','EA015F73-7049-48FF-B4F6-E0246C60DBE0','2025-03-24 23:28:43'),(678,'merry','6','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6Im1lcnJ5IiwiaWF0IjoxNzQ4OTkyNzUyfQ.KaXO8JbFTSJMKH9KoOB8tMw44hASF9sB2h2BAoBxsRk','merry_postman','2025-06-03 23:19:12'),(661,'frodo','2','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImZyb2RvIiwiaWF0IjoxNzQ4Mzg4MTY3fQ.yHwh2BLOLAnTStQBVtxhBwMKaN9yZj52jWIU1Nn8mQ4','frodo_postman','2025-05-27 23:22:47'),(902,'frodo','2','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImZyb2RvIiwiaWF0IjoxNzU3NzE4ODIwfQ.Y16MKMitH2fH00OMyuQLiDMMR9hwIUurYX0f-JU-iVI','davey_postman','2025-09-12 23:13:40'),(681,'pippin','5','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InBpcHBpbiIsImlhdCI6MTc0ODk5Mzc5NX0.54wdc6xQWYtdqEQu6ollpGeQ7Iizqsh3OHJRZUnI6w8','pippin_postman','2025-06-03 23:36:35'),(680,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzQ4OTkzNTU3fQ.6B2PDnVh6afelxjFRMOuOeQcX42Y-xKMWLAmapfrgiY','pippin_postman','2025-06-03 23:32:37'),(913,'merry','6','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6Im1lcnJ5IiwiaWF0IjoxNzU3OTc2NzU3fQ.PnKZvgqT5N8Eh4xdJkO7s_wvv63fz8ZbLaEG6Oc0sbM','davey_postman','2025-09-15 22:52:37'),(698,'pippin','5','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InBpcHBpbiIsImlhdCI6MTc0OTE2NzIwOH0._LQXCV5rdIrYHYnkuLIRp6tJnfsJw9JaCsksdhetcLc','davey_postman','2025-06-05 23:46:48'),(1051,'sam','8','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6InNhbSIsImlhdCI6MTc3MDE2NjE2MX0.o6U-uvqsM1q1qZguEgq2rxPpgK0QdamXqaY2AO8nUes','davey_postman','2026-02-04 00:49:21'),(984,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzYxNDM1NzcwfQ.KNvykDrHQsk14OYxLmcDoIT6gAjSUghvKMmzdzOVHqs','7697E4AA-E507-405C-9524-93A013845131','2025-10-25 23:42:50'),(720,'Pippin','5','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6IlBpcHBpbiIsImlhdCI6MTc0OTc3MDUyOX0.JFreuQzUM4_doJ-B60ag2GN1JhVHnjeu1nNiRQXiJiM','7697E4AA-E507-405C-9524-93A013845131','2025-06-12 23:22:09'),(909,'frodo','2','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImZyb2RvIiwiaWF0IjoxNzU3ODAzMjIyfQ.dEbOcSOL-rQPGmtrO0YrkahmQXdwWIkLhFRLrqwOQ9A','7697E4AA-E507-405C-9524-93A013845131','2025-09-13 22:40:22'),(813,'Merry','6','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6Ik1lcnJ5IiwiaWF0IjoxNzU0MTc5MDI1fQ.1VpvRqNi65KDwOdwuXNL6sR_W5NOHyBx6O53Hv7kP30','7697E4AA-E507-405C-9524-93A013845131','2025-08-02 23:57:05'),(1089,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzczODc3MjYzfQ.QnEyxKEGLuHFAKiqBODVF-PS1Sgw3Cx2CuzzZK-3pFU','98F12150-15C6-4B26-BDAB-C74905CEC788','2026-03-18 23:41:03'),(1018,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzY1ODQ0MTcxfQ.RLD8OL8Q13kC8fbYZU2m_6mMhuSJFZyU5thmiM-Fdxw','9986F39C-6295-4BAE-AE75-2DD19E7EF54D','2025-12-16 00:16:11'),(999,'davey','1','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXJyZW50VXNlciI6ImRhdmV5IiwiaWF0IjoxNzYzNzY5NDI1fQ.9uhgVjlCTACxXiiwffvZaD-KizQTn2jx-uESxYABrzE','07A64C0B-DBCF-4116-B754-9F0ABA470376','2025-11-21 23:57:05');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_analytics`
--

DROP TABLE IF EXISTS `user_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_analytics` (
  `analytics_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `page_url` varchar(255) NOT NULL,
  `last_visit` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `total_visits` int NOT NULL,
  `group_id` int NOT NULL,
  `icon_id` varchar(255) NOT NULL,
  `last_click` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_clicks` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`analytics_id`)
) ENGINE=InnoDB AUTO_INCREMENT=355 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_analytics`
--

LOCK TABLES `user_analytics` WRITE;
/*!40000 ALTER TABLE `user_analytics` DISABLE KEYS */;
INSERT INTO `user_analytics` VALUES (351,'vasquezd','groups.php','2018-02-02 00:19:18',17,0,'','2018-04-02 23:23:16',0,0),(352,'vasquezd','','0000-00-00 00:00:00',0,0,'js-activity-group-icon','2018-02-22 23:34:05',4,0),(353,'vasquezd','','0000-00-00 00:00:00',0,0,'js-notification-header-seen','2018-02-22 23:34:04',4,0),(354,'Vasquezd','group_posts.php','2018-03-27 21:20:28',11,330,'','2018-03-27 21:24:41',0,0);
/*!40000 ALTER TABLE `user_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_login`
--

DROP TABLE IF EXISTS `user_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_login` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(20) NOT NULL DEFAULT 'username',
  `user_email` varchar(255) NOT NULL DEFAULT 'useremail',
  `salt` varchar(255) NOT NULL DEFAULT 'salt',
  `password` varchar(255) NOT NULL DEFAULT 'password',
  `last_login` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_logout` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `login_total` int NOT NULL DEFAULT '0',
  `account_deleted` int NOT NULL DEFAULT '0',
  `password_reset_key` varchar(255) NOT NULL DEFAULT 'null',
  `password_reset_sent` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `password_reset_used` int NOT NULL DEFAULT '0',
  `password_reset_status` varchar(255) NOT NULL DEFAULT 'null',
  UNIQUE KEY `user_id_2` (`user_id`),
  UNIQUE KEY `user_name` (`user_name`),
  UNIQUE KEY `user_name_2` (`user_name`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_login`
--

LOCK TABLES `user_login` WRITE;
/*!40000 ALTER TABLE `user_login` DISABLE KEYS */;
INSERT INTO `user_login` VALUES (1,'davey','davey@gmail.com','$2b$10$13UTGC/rkiZ/bh/iHZepi.','$2b$10$13UTGC/rkiZ/bh/iHZepi.OgejSH7Mi4azVlb6Sb9zxD8xRVEdSZe','2025-01-28 00:45:08','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(2,'frodo','frodo@gmail.com','$2b$10$YbZ.katAPpAfoFeHvkP5Pu','$2b$10$YbZ.katAPpAfoFeHvkP5Pu1ORiZkm.isNnsPP5WS5O2dpqLetb5ye','2025-01-30 00:21:46','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(3,'frodo2','frodo@gmail.com','$2b$10$BzcvMlG2PwMowhfeDYr7Ue','$2b$10$BzcvMlG2PwMowhfeDYr7UeGshIQ302sNyQPTA7KFq4RLg0sGQOHt2','2025-02-09 00:25:16','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(4,'frodo22','frodo22@gmail.com','$2b$10$227qwVy8LwKUoq2lt86DI.','$2b$10$227qwVy8LwKUoq2lt86DI.ymqZtCf0jpjLSwQsaY/5jky1ltd/Kim','2025-03-24 00:03:47','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(5,'pippin','pippin@gmail.com','$2b$10$GxHWnXaFxjC9n968xZsIe.','$2b$10$GxHWnXaFxjC9n968xZsIe.X1YJAI7d0eSdaICXhyE0QOF.D2xdHEm','2025-05-11 23:21:03','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(6,'merry','merry@gmail.com','$2b$10$i67oNktNVO70O2SbzltLle','$2b$10$i67oNktNVO70O2SbzltLleXUV0LOoikxAkuvg23v57Pm.EJXyQ.IG','2025-05-11 23:21:12','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(7,'bilbo','bilbo@gmail.com','$2b$10$gvxMdDOjl.r1fdCCGyMEGO','$2b$10$gvxMdDOjl.r1fdCCGyMEGOdf998KQWNBUuvX0bLS6b5u0oS294wfK','2025-06-01 23:07:08','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(8,'sam','sam@gmail.com','$2b$10$Og4sPYV1ZqnZ6/GS1cXcBu','$2b$10$Og4sPYV1ZqnZ6/GS1cXcBuWt3QG4Ej1ctJ34JAC2lQwp733hsTE0G','2025-06-06 22:06:16','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(9,'Sam2','sam2@gmail.com','$2b$10$.8xW.zGLMdgd.s33vm4vbe','$2b$10$.8xW.zGLMdgd.s33vm4vbe7zadYIwyBlXzkvFZYZE7LkADUxCznCi','2026-02-19 00:49:22','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(10,'sam3','sam3@gmail.com','$2b$10$51ZmtQuWofoPYIAfdA574.','$2b$10$51ZmtQuWofoPYIAfdA574.umgVguZHBhrEUxvLZwbLgJZkQ42MTKq','2026-02-19 00:50:14','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(11,'sam4','sam4@gmail.com','$2b$10$JUD2FJCL/YH6LKdtW5/zJ.','$2b$10$JUD2FJCL/YH6LKdtW5/zJ.TvCeJM5oBxKLzcWqZhiWHZahZllazGa','2026-02-19 00:52:41','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(12,'Sam5','sam5@gmail.com','$2b$10$oGY.nBTbpYduozgSxfml5O','$2b$10$oGY.nBTbpYduozgSxfml5O0DvhzqK.687YPIn9iCth/PIoGPJ5TX2','2026-02-19 00:54:02','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(13,'sam7','sam7@gmail.com','$2b$10$fCfhrKwYIUjt4KrxFXPMVO','$2b$10$fCfhrKwYIUjt4KrxFXPMVOr5UbWrIyyLfjq4BjRGZM7eVfhd2GHKS','2026-02-20 00:29:21','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null');
/*!40000 ALTER TABLE `user_login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profile`
--

DROP TABLE IF EXISTS `user_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profile` (
  `user_profile_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL DEFAULT '0',
  `user_name` varchar(50) NOT NULL DEFAULT '"bilbo"',
  `email` varchar(255) NOT NULL DEFAULT '"Email"',
  `image_name` varchar(50) NOT NULL DEFAULT '"bilbo.jpg"',
  `first_name` varchar(50) NOT NULL DEFAULT '"First"',
  `last_name` varchar(50) NOT NULL DEFAULT '"last"',
  `root_folder` varchar(255) NOT NULL DEFAULT '"root"',
  `biography` varchar(255) DEFAULT 'biography',
  `storage_location` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'storage_location',
  `cloud_bucket` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'cloud_bucket',
  `cloud_key` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'cloud_key',
  `image_url` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'image_url',
  `file_name` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'file_name',
  `file_name_server` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT 'file_name_server',
  `university` varchar(50) NOT NULL DEFAULT '"osu"',
  `post_view` varchar(255) NOT NULL DEFAULT '"nada"',
  `account_active` int NOT NULL DEFAULT '1',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_profile_id`),
  UNIQUE KEY `user_name` (`user_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profile`
--

LOCK TABLES `user_profile` WRITE;
/*!40000 ALTER TABLE `user_profile` DISABLE KEYS */;
INSERT INTO `user_profile` VALUES (1,1,'davey','davey@gmail.com','frodo.jpg','David','Vasquez','davey','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-us-west-two','profile/profileImage-1754177896055-604384021-1597356887small7_p0_master1200.jpg','http://localhost:3003/kite-us-west-two/profile/profileImage-1754177896055-604384021-1597356887small7_p0_master1200.jpg','1597356887small7_p0_master1200.jpg','profileImage-1754177896055-604384021-1597356887small7_p0_master1200.jpg','osu','',1,'2025-01-28 00:45:08','2025-01-28 00:45:08'),(2,2,'frodo','frodo@gmail.com','frodo.jpg','Mr Frodo','Baggins','frodo','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-us-west-two','profile/profileImage-1754179017959-192682793-image.jpg','http://localhost:3003/kite-us-west-two/profile/profileImage-1754179017959-192682793-image.jpg','image.jpg','profileImage-1754179017959-192682793-image.jpg','osu','',1,'2025-01-30 00:21:46','2025-01-30 00:21:46'),(5,5,'pippin','pippin@gmail.com','frodo.jpg','Pippin','BrandyBuck','pippin','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-profile-us-west-two','public/kite-profile-us-west-two/profileImage-1748475610744-101974712-76909388_p0.jpg','http://localhost:3003/kite-profile-us-west-two/profileImage-1748475610744-101974712-76909388_p0.jpg','76909388_p0.jpg','profileImage-1748475610744-101974712-76909388_p0.jpg','osu','',1,'2025-05-11 23:21:03','2025-05-11 23:21:03'),(6,6,'merry','merry@gmail.com','frodo.jpg','Merry','Brandybuck','merry','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-us-west-two','profile/profileImage-1769128735576-173801783-1592181130257post.jpg','http://localhost:3003/kite-us-west-two/profile/profileImage-1769128735576-173801783-1592181130257post.jpg','1592181130257post.jpg','profileImage-1769128735576-173801783-1592181130257post.jpg','osu','',1,'2025-05-11 23:21:12','2025-05-11 23:21:12'),(7,7,'bilbo','bilbo@gmail.com','frodo.jpg','Bilbo Baggins','Bilbo Baggins','bilbo','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','storage_location','cloud_bucket','cloud_key','image_url','file_name','file_name_server','osu','',1,'2025-06-01 23:07:08','2025-06-01 23:07:08'),(8,8,'sam','sam@gmail.com','frodo.jpg','Sam','Gamgee','sam','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-us-west-two','profile/profileImage-1754179059128-371857907-image.jpg','http://localhost:3003/kite-us-west-two/profile/profileImage-1754179059128-371857907-image.jpg','image.jpg','profileImage-1754179059128-371857907-image.jpg','osu','',1,'2025-06-06 22:06:16','2025-06-06 22:06:16'),(9,9,'Sam2','sam2@gmail.com','frodo.jpg','Sam Gamgee','Sam Gamgee','Sam2','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','storage_location','cloud_bucket','cloud_key','image_url','file_name','file_name_server','osu','',1,'2026-02-19 00:49:22','2026-02-19 00:49:22'),(10,10,'sam3','sam3@gmail.com','frodo.jpg','Sam Gamgee','Sam Gamgee','sam3','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','storage_location','cloud_bucket','cloud_key','image_url','file_name','file_name_server','osu','',1,'2026-02-19 00:50:14','2026-02-19 00:50:14'),(11,11,'sam4','sam4@gmail.com','frodo.jpg','Sam Gamgee','Sam Gamgee','sam4','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','storage_location','cloud_bucket','cloud_key','image_url','file_name','file_name_server','osu','',1,'2026-02-19 00:52:41','2026-02-19 00:52:41'),(12,12,'Sam5','sam5@gmail.com','frodo.jpg','Sam Gamgee','Sam Gamgee','Sam5','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','storage_location','cloud_bucket','cloud_key','image_url','file_name','file_name_server','osu','',1,'2026-02-19 00:54:02','2026-02-19 00:54:02'),(13,13,'sam7','sam7@gmail.com','frodo.jpg','Sam Gamgee','Sam Gamgee','sam7','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','storage_location','cloud_bucket','cloud_key','image_url','file_name','file_name_server','osu','',1,'2026-02-20 00:29:21','2026-02-20 00:29:21');
/*!40000 ALTER TABLE `user_profile` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-19 15:54:55
