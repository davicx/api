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
) ENGINE=InnoDB AUTO_INCREMENT=742 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (698,'davey',39,'vasquezd',1,'davey','vasquezd',0,'daveyvasquezd','2023-09-10 23:59:14'),(699,'vasquezd',1,'davey',39,'davey','vasquezd',0,'vasquezddavey','2023-09-10 23:59:14'),(702,'davey',39,'bilbo',41,'davey','bilbo',0,'daveybilbo','2023-09-10 23:59:14'),(703,'bilbo',41,'davey',39,'davey','bilbo',0,'bilbodavey','2023-09-10 23:59:14'),(704,'davey',39,'merry',42,'davey','merry',0,'daveymerry','2023-09-10 23:59:14'),(705,'merry',42,'davey',39,'davey','merry',0,'merrydavey','2023-09-10 23:59:14'),(710,'davey',39,'matt',2,'davey','matt',0,'daveymatt','2023-12-03 00:58:07'),(711,'matt',2,'davey',39,'davey','matt',0,'mattdavey','2023-12-03 00:58:07'),(712,'davey',39,'frodo2',44,'davey','frodo2',0,'daveyfrodo2','2023-12-03 00:58:07'),(713,'frodo2',44,'davey',39,'davey','frodo2',0,'frodo2davey','2023-12-03 00:58:07'),(714,'davey',39,'frodo3',45,'davey','frodo3',0,'daveyfrodo3','2023-12-03 00:58:07'),(715,'frodo3',45,'davey',39,'davey','frodo3',0,'frodo3davey','2023-12-03 00:58:07'),(718,'frodo',40,'sam',43,'frodo','sam',0,'frodosam','2024-01-02 00:05:41'),(719,'sam',43,'frodo',40,'frodo','sam',0,'samfrodo','2024-01-02 00:05:41'),(720,'frodo',40,'merry',42,'frodo','merry',0,'frodomerry','2024-01-02 00:05:41'),(721,'merry',42,'frodo',40,'frodo','merry',0,'merryfrodo','2024-01-02 00:05:41'),(722,'frodo',40,'pippin',46,'frodo','pippin',0,'frodopippin','2024-01-02 00:05:41'),(723,'pippin',46,'frodo',40,'frodo','pippin',0,'pippinfrodo','2024-01-02 00:05:41'),(724,'sam',43,'pippin',46,'sam','pippin',0,'sampippin','2024-01-02 00:05:41'),(725,'pippin',46,'sam',43,'sam','pippin',0,'pippinsam','2024-01-02 00:05:41'),(726,'sam',43,'merry',42,'sam','merry',0,'sammerry','2024-01-02 00:05:41'),(727,'merry',42,'sam',43,'sam','merry',0,'merrysam','2024-01-02 00:05:41'),(728,'davey',39,'Frodo',40,'davey','Frodo',0,'daveyFrodo','2024-05-16 22:52:33'),(729,'Frodo',40,'davey',39,'davey','Frodo',0,'Frododavey','2024-05-16 22:52:33'),(730,'davey',39,'sam',43,'davey','sam',0,'daveysam','2024-01-02 00:30:48'),(731,'sam',43,'davey',39,'davey','sam',0,'samdavey','2024-01-02 00:30:48'),(732,'davey',39,'pippin',46,'davey','pippin',0,'daveypippin','2024-01-02 00:30:48'),(733,'pippin',46,'davey',39,'davey','pippin',0,'pippindavey','2024-01-02 00:30:48'),(734,'davey',39,'frodo4',47,'davey','frodo4',0,'daveyfrodo4','2024-02-18 00:46:24'),(735,'frodo4',47,'davey',39,'davey','frodo4',0,'frodo4davey','2024-02-18 00:46:24'),(736,'davey',39,'frodo5',48,'davey','frodo5',0,'daveyfrodo5','2024-02-18 00:46:24'),(737,'frodo5',48,'davey',39,'davey','frodo5',0,'frodo5davey','2024-02-18 00:46:24'),(738,'davey',39,'frodo6',49,'davey','frodo6',0,'daveyfrodo6','2024-02-18 00:46:24'),(739,'frodo6',49,'davey',39,'davey','frodo6',0,'frodo6davey','2024-02-18 00:46:24'),(740,'davey',39,'frodo7',50,'davey','frodo7',0,'daveyfrodo7','2024-02-18 00:46:24'),(741,'frodo7',50,'davey',39,'davey','frodo7',0,'frodo7davey','2024-02-18 00:46:24');
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
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
