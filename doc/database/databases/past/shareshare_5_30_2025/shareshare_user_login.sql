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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_login`
--

LOCK TABLES `user_login` WRITE;
/*!40000 ALTER TABLE `user_login` DISABLE KEYS */;
INSERT INTO `user_login` VALUES (1,'davey','davey@gmail.com','$2b$10$13UTGC/rkiZ/bh/iHZepi.','$2b$10$13UTGC/rkiZ/bh/iHZepi.OgejSH7Mi4azVlb6Sb9zxD8xRVEdSZe','2025-01-28 00:45:08','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(2,'frodo','frodo@gmail.com','$2b$10$YbZ.katAPpAfoFeHvkP5Pu','$2b$10$YbZ.katAPpAfoFeHvkP5Pu1ORiZkm.isNnsPP5WS5O2dpqLetb5ye','2025-01-30 00:21:46','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(3,'frodo2','frodo@gmail.com','$2b$10$BzcvMlG2PwMowhfeDYr7Ue','$2b$10$BzcvMlG2PwMowhfeDYr7UeGshIQ302sNyQPTA7KFq4RLg0sGQOHt2','2025-02-09 00:25:16','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(4,'frodo22','frodo22@gmail.com','$2b$10$227qwVy8LwKUoq2lt86DI.','$2b$10$227qwVy8LwKUoq2lt86DI.ymqZtCf0jpjLSwQsaY/5jky1ltd/Kim','2025-03-24 00:03:47','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(5,'pippin','pippin@gmail.com','$2b$10$GxHWnXaFxjC9n968xZsIe.','$2b$10$GxHWnXaFxjC9n968xZsIe.X1YJAI7d0eSdaICXhyE0QOF.D2xdHEm','2025-05-11 23:21:03','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(6,'merry','merry@gmail.com','$2b$10$i67oNktNVO70O2SbzltLle','$2b$10$i67oNktNVO70O2SbzltLleXUV0LOoikxAkuvg23v57Pm.EJXyQ.IG','2025-05-11 23:21:12','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null');
/*!40000 ALTER TABLE `user_login` ENABLE KEYS */;
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
