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
  `biography` text,
  `university` varchar(50) NOT NULL DEFAULT '"osu"',
  `post_view` varchar(255) NOT NULL DEFAULT '"nada"',
  `account_active` int NOT NULL DEFAULT '1',
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_profile_id`),
  UNIQUE KEY `user_name` (`user_name`)
) ENGINE=InnoDB AUTO_INCREMENT=202 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profile`
--

LOCK TABLES `user_profile` WRITE;
/*!40000 ALTER TABLE `user_profile` DISABLE KEYS */;
INSERT INTO `user_profile` VALUES (46,1,'vasquezd','Vasquezd@onid.orst.edu','12.jpg','David','Vasquez','Vasquezd','My Biography','Oregon State ','large',1,'2016-04-04 11:33:50','2014-08-22 08:00:05'),(47,2,'matt','vasquezm@shareshare.com','matt.jpg','Matt','Vasquez','','This is matts page!','','',1,'2015-12-01 20:55:10','2022-03-06 08:25:39'),(49,4,'Kristen','vasquezj@shareshare.com','david.jpg','Kristen','Vasquez','','this is my page!','','',1,'2015-12-03 19:25:43','2022-03-06 08:25:39'),(50,5,'Aimee','Aimeeaileen@mac.com','11.jpg','Aimee','Vasquez','Vasquez','They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \n	making a noise like elephants which they can hear a mile off <- Not your bio change it here','','',1,'2015-12-08 00:28:40','2022-03-06 08:25:39'),(51,6,'Becca','','Becca.jpg','Becca','Vasquez','vasquezma','They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \r\n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \r\n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \r\n	making a noise like elephants which they can hear a mile off <- Not your bio change it here','','',1,'2016-04-10 11:03:19','2022-03-06 08:25:39'),(52,7,'Sarah','','sarah.jpg','Sarah','Vasquez','Vasquezbb','They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \r\n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \r\n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \r\n	making a noise like elephants which they can hear a mile off <- Not your bio change it here','','',1,'2015-12-01 20:57:23','2022-03-06 08:25:39'),(190,39,'davey','davey@gmail.com','password','david v','v','davey','v','osu','',1,'2023-03-05 00:48:39','2023-03-05 00:48:39'),(191,40,'Frodo','frodo@gmail.com','Frodo.jpg','frodo v','frodo v','frodo','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-03-05 00:48:55','2023-03-05 00:48:55'),(192,41,'bilbo','Bilbo@gmail.com','bilbo.jpg','Bilbo v','Bilbo v','bilbo','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-03-05 00:49:02','2023-03-05 00:49:02'),(193,42,'merry','merry@gmail.com','merry.jpg','merry v','merry v','merry','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-03-05 00:49:09','2023-03-05 00:49:09'),(194,43,'sam','sam@gmail.com','sam.jpg','sam gamgee','sam gamgee','sam','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-03-05 00:50:53','2023-03-05 00:50:53'),(195,44,'frodo2','frodo@gmail.com','frodo.jpg','frodo baggins','frodo baggins','frodo2','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-04-23 22:23:02','2023-04-23 22:23:02'),(196,45,'frodo3','frodo@gmail.com','frodo.jpg','frodo baggins','frodo baggins','frodo3','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-04-23 22:24:41','2023-04-23 22:24:41'),(197,46,'pippin','Pippin@gmail.com','pippin.jpg','Pippin Brandybuck','Pippin Brandybuck','pippin','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2023-06-25 23:46:52','2023-06-25 23:46:52'),(198,47,'frodo4','frodo4@gmail.com','frodo.jpg','frodo4 Brandybuck','frodo4 Brandybuck','frodo4','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2024-02-18 00:44:44','2024-02-18 00:44:44'),(199,48,'frodo5','frodo5@gmail.com','frodo.jpg','frodo5 Brandybuck','frodo5 Brandybuck','frodo5','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2024-02-18 00:44:54','2024-02-18 00:44:54'),(200,49,'frodo6','frodo6@gmail.com','frodo.jpg','frodo6 Brandybuck','frodo6 Brandybuck','frodo6','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2024-02-18 00:45:00','2024-02-18 00:45:00'),(201,50,'frodo7','frodo7@gmail.com','frodo.jpg','frodo7 Brandybuck','frodo7 Brandybuck','frodo7','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','osu','',1,'2024-02-18 00:45:07','2024-02-18 00:45:07');
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

-- Dump completed on 2024-06-22 15:40:33
