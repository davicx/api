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
-- Table structure for table `comments_original`
--

DROP TABLE IF EXISTS `comments_original`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments_original` (
  `comment_id` int unsigned NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `post_id` int NOT NULL,
  `comment_is_child` int NOT NULL,
  `comment` text NOT NULL,
  `comment_from` varchar(255) NOT NULL,
  `likes` int NOT NULL,
  `has_file` int NOT NULL,
  `file_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_name_server` varchar(255) NOT NULL,
  `comment_deleted` int NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments_original`
--

LOCK TABLES `comments_original` WRITE;
/*!40000 ALTER TABLE `comments_original` DISABLE KEYS */;
INSERT INTO `comments_original` VALUES (46,0,186,0,'This hobbit was a very well-to-do hobbit, and his name was Baggins. \n								The Bagginses had lived in the neighbourhood of The Hill for time out of mind, \n								and people considered them very respectable, not only because most of them were rich, \n								but also because they never had any adventures or did anything unexpected: \n								you could tell what a Baggins would say on any question without the bother of asking him. \n								This is a story of how a Baggins had an adventure, found himself doing and saying things \n								altogether unexpected. He may have lost the neighbours\' respect, but he gained-well, \n								you will see whether he gained anything in the end. ','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:16','2017-03-30 22:37:27'),(47,0,186,0,'This was bad grammar of course, but that is how beavers talk when they are excited; I mean, in Narnia--in our world they usually don\'t talk at all. ','sarah',0,0,0,'','',0,'2017-04-05 23:56:42','2016-07-08 22:37:32'),(48,0,186,0,'It is as hard to explain how this sunlit land was different from the old Narnia as it would be to tell you how the fruits of that country taste. Perhaps you will get some idea of it if you think like this. You may have been in a room in which there was a window that looked out on a lovely bay of the sea or a green valley that wound away among mountains. ','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:19','2016-07-08 22:37:38'),(69,0,0,0,'lifehouse','vasquezd',0,1,0,'Lighthouse.jpg','1491255927Lighthouse.jpg',0,'2017-04-03 21:45:27','2017-04-03 21:45:27'),(71,0,0,0,'file','vasquezd',0,1,0,'Hydrangeas.jpg','1491265119Hydrangeas.jpg',0,'2017-04-04 00:18:39','2017-04-04 00:18:39'),(72,0,0,1,'this is the new child comment','vasquezd',0,1,0,'Tulips.jpg','1491265606Tulips.jpg',0,'2017-04-06 00:21:21','2017-04-04 00:26:46'),(73,0,0,0,'this is new','matt',0,0,0,'','',1,'2017-04-06 00:21:45','2017-04-05 00:12:08'),(74,0,0,0,'hi','kristen',0,0,0,'','',0,'2017-04-05 23:56:07','2017-04-05 23:13:53'),(75,0,0,1,'helo child','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:24','2017-04-05 23:17:17'),(76,0,0,1,'helo child','vasquezd',0,0,0,'','',0,'2017-04-05 23:18:19','2017-04-05 23:17:50'),(77,0,0,1,'helo child','vasquezd',0,0,0,'','',0,'2017-04-05 23:20:12','2017-04-05 23:20:12'),(78,0,0,1,'hello new child ','vasquezd',0,0,0,'','',0,'2017-04-06 00:13:31','2017-04-05 23:20:52'),(79,0,0,1,'helo child','matt',0,0,0,'','',0,'2017-04-05 23:54:48','2017-04-05 23:25:25'),(80,0,0,1,'helo child','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:25','2017-04-05 23:25:31'),(81,0,0,1,'helo child','brian',0,0,0,'','',0,'2017-04-06 00:21:26','2017-04-05 23:47:52'),(82,0,0,1,'helo child','sarah',0,0,0,'','',0,'2017-04-06 00:21:27','2017-04-05 23:48:06'),(83,0,0,1,'helo child','vasquezd',0,0,0,'','',0,'2017-04-05 23:48:10','2017-04-05 23:48:10'),(84,0,0,1,'helo child','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:29','2017-04-05 23:48:16'),(85,0,0,1,'helo child','sarah',0,0,0,'','',1,'2017-04-06 00:22:23','2017-04-05 23:49:29'),(86,0,0,1,'why','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:31','2017-04-05 23:49:35'),(87,0,0,1,'thats better ','vasquezd',0,0,0,'','',0,'2017-04-05 23:49:42','2017-04-05 23:49:42'),(88,0,0,1,'thats better why','sarah',0,0,0,'','',0,'2017-04-06 00:21:32','2017-04-05 23:50:21'),(89,0,0,1,'clear out','vasquezd',0,0,0,'','',0,'2017-04-06 00:21:34','2017-04-05 23:50:34'),(90,0,0,1,'right now','sarah',0,0,0,'','',0,'2017-04-06 00:21:35','2017-04-05 23:50:54'),(91,0,0,1,'hard to see down here','vasquezd',0,0,0,'','',0,'2017-04-05 23:51:11','2017-04-05 23:51:11'),(92,0,0,1,'right?1','vasquezd',0,0,0,'','',1,'2017-04-06 00:21:49','2017-04-05 23:51:20'),(93,0,0,0,'still work?','vasquezd',0,0,0,'','',0,'2017-04-06 22:46:24','2017-04-06 22:46:24'),(94,0,0,1,'ok','vasquezd',0,0,0,'','',1,'2017-04-06 23:16:52','2017-04-06 23:14:48'),(95,0,0,0,'this is a new comment','vasquezd',0,0,0,'','',0,'2017-04-06 23:46:54','2017-04-06 23:46:54'),(96,0,0,1,'oh t otall i agree','vasquezd',0,0,0,'','',0,'2017-04-06 23:47:26','2017-04-06 23:47:26'),(97,0,438,0,'this is a new comment yaya!','vasquezd',0,0,0,'','',0,'2017-08-22 23:56:32','2017-04-06 23:54:14'),(98,0,0,0,'check out the new files I put for our game','vasquezd',0,0,0,'','',0,'2017-04-06 23:54:27','2017-04-06 23:54:27'),(99,0,0,0,'hello what a great video','vasquezd',0,0,0,'','',0,'2017-08-23 00:25:14','2017-08-23 00:25:14'),(100,0,438,0,'hello what a great video!!!!','vasquezd',0,0,0,'','',0,'2017-08-24 00:17:03','2017-08-23 00:26:33'),(101,0,438,0,'This is new','vasquezd',0,0,0,'','',1,'2017-08-24 00:15:03','2017-08-23 23:19:29'),(102,0,438,0,'Does this work?','vasquezd',0,0,0,'','',0,'2017-08-31 21:09:21','2017-08-31 21:09:21'),(103,0,18,0,'this is cool!','vasquezd',0,0,0,'','',0,'2017-10-01 23:07:17','2017-10-01 23:07:17'),(104,0,18,0,'ya!','vasquezd',0,0,0,'','',0,'2017-10-01 23:07:41','2017-10-01 23:07:41'),(105,0,187,0,'hello','vasquezd',0,0,0,'','',1,'2019-07-30 00:02:33','2019-06-13 23:54:21'),(106,0,187,0,'hi','vasquezd',0,0,0,'','',1,'2019-07-30 00:03:09','2019-06-13 23:58:36'),(107,0,187,0,'oh','vasquezd',0,0,0,'','',1,'2019-07-30 00:02:41','2019-06-13 23:58:40'),(108,0,185,0,'meya','vasquezd',0,0,0,'','',0,'2019-06-13 23:58:45','2019-06-13 23:58:45'),(109,0,185,0,'hoya ','vasquezd',0,0,0,'','',0,'2019-06-14 00:00:58','2019-06-14 00:00:58'),(110,0,185,0,'comment 1 ','vasquezd',0,0,0,'','',0,'2019-06-14 00:01:08','2019-06-14 00:01:08'),(111,0,185,0,'comment 2','vasquezd',0,0,0,'','',0,'2019-06-14 00:01:12','2019-06-14 00:01:12'),(112,0,185,0,'comment 3','vasquezd',0,0,0,'','',0,'2019-06-14 00:01:16','2019-06-14 00:01:16'),(113,0,187,0,'Comment 1','vasquezd',0,0,0,'','',1,'2019-07-30 00:03:12','2019-06-14 00:01:34'),(114,0,187,0,'Comment 2','vasquezd',0,0,0,'','',1,'2019-07-30 00:03:15','2019-06-14 00:01:38'),(115,0,187,0,'comment 3','becca',0,0,0,'','',0,'2019-06-14 20:45:20','2019-06-14 20:45:20'),(116,0,79,0,'hi','vasquezd',0,0,0,'','',0,'2019-08-20 21:19:29','2019-08-20 21:19:29');
/*!40000 ALTER TABLE `comments_original` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-06-22 15:40:34
