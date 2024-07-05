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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_login`
--

LOCK TABLES `user_login` WRITE;
/*!40000 ALTER TABLE `user_login` DISABLE KEYS */;
INSERT INTO `user_login` VALUES (1,'vasquezd','vasquezd@onid.orst.edu','1494015793','c3be883dd5822f892141e642962084d6be47c2bf','2021-11-05 23:51:08','2019-08-26 23:30:25',950,0,'A2XMVdcf3SNCMpkIJQqxbnSOfPcGIHul','2017-05-06 03:28:32',0,'1'),(2,'matt','','1448946249','de85ef10d2853b10978ac6c8e0c37c354d3b6969','2019-06-04 22:33:50','2017-11-09 07:53:13',117,0,'','0000-00-00 00:00:00',0,''),(3,'brian','','1448946380','ace622215c315ce82bfd153b63c7faeb218a17da','2017-05-19 07:05:25','2017-05-19 07:06:50',10,0,'','0000-00-00 00:00:00',0,''),(4,'Kristen','','1448946380','e3ae7af8145e258b854728fc9cebe6c8891ee2a5','2019-06-12 23:01:46','2017-11-09 07:54:16',19,0,'','0000-00-00 00:00:00',0,''),(5,'Aimee','','1448946380','33f916c66f61bbf37a12105c8bb3e0fc8ea75fd6','2017-10-20 04:38:11','2016-11-06 04:11:01',16,0,'','0000-00-00 00:00:00',0,''),(6,'Becca','','1448946503','ba342a034cc175fb24a1c3d59d190da0c31f0106','2019-08-15 20:08:06','2019-08-15 20:08:06',31,0,'','0000-00-00 00:00:00',0,''),(7,'Sarah','','1448946503','378d32da508020f682a238053fec6f307e0aa30a','2019-05-03 22:29:15','2017-07-25 06:26:11',5,0,'','0000-00-00 00:00:00',0,''),(39,'davey','davey@gmail.com','$2b$10$IvGqZKq.022TLqJxG9pBN.','$2b$10$IvGqZKq.022TLqJxG9pBN.4oeNTs/BGMCwx067lw/xG9yXeq/sC8O','2023-03-05 00:48:39','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(40,'Frodo','frodo@gmail.com','$2b$10$E5snyqTEO.Kmd7X5PBEDf.','$2b$10$E5snyqTEO.Kmd7X5PBEDf.YnhKUC03g4ZUeKo5iU2JGGPU2A23KZW','2023-04-23 23:13:12','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(41,'bilbo','Bilbo@gmail.com','$2b$10$AqZpNpQLowBNXYJqIPxEe.','$2b$10$AqZpNpQLowBNXYJqIPxEe.hHyKEgkXFrrxXNotmpiSVnfbZvWXDuK','2023-03-05 00:49:02','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(42,'merry','merry@gmail.com','$2b$10$Obzk6v/XPzQ/CpMwGzcsV.','$2b$10$Obzk6v/XPzQ/CpMwGzcsV.JMmww1nfF/lcywXzoAZfzrbPO6hX8w2','2023-03-05 00:49:09','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(43,'sam','sam@gmail.com','$2b$10$zuSoYEs8D2hQ/nNYuhm1E.','$2b$10$zuSoYEs8D2hQ/nNYuhm1E.OHgtSq.Eh74r.ejdNjQjJpiYIwJEmd2','2023-03-05 00:50:53','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(44,'frodo2','frodo@gmail.com','$2b$10$29BhmVhtJhLU6JlSSzFR/e','$2b$10$29BhmVhtJhLU6JlSSzFR/eX0.KE2mbLwChvVtN6qy/7ADoSSW5wtS','2023-04-23 22:23:02','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(45,'frodo3','frodo@gmail.com','$2b$10$bsy2xfPX0P2jTufFvJKgAu','$2b$10$bsy2xfPX0P2jTufFvJKgAuvvFdDNNbrhxao2WvN2BJIIn9y10Py6O','2023-04-23 22:24:41','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(46,'pippin','Pippin@gmail.com','$2b$10$kiOANjOtJzvvx0K2UcUkOe','$2b$10$kiOANjOtJzvvx0K2UcUkOem43n52fIUddFudwdk7JI0TEP7D3s8vi','2023-06-25 23:46:52','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(47,'frodo4','frodo4@gmail.com','$2b$10$IxTySm09aSO5JiTz5P4Pu.','$2b$10$IxTySm09aSO5JiTz5P4Pu.iMHbQuk3GIHHBXzpojxiOkGBBnUqYuq','2024-02-18 00:44:44','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(48,'frodo5','frodo5@gmail.com','$2b$10$3zRn.Bjt/PK1n2l/gCwfKe','$2b$10$3zRn.Bjt/PK1n2l/gCwfKeGft56KkMp2OHM9vQa80ePWfOM95rFwy','2024-02-18 00:44:54','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(49,'frodo6','frodo6@gmail.com','$2b$10$FFq1GVoYekvJ7.ZYaA3nJ.','$2b$10$FFq1GVoYekvJ7.ZYaA3nJ.JIeLCfVEFNYleTlpplUEwxvS963hW9S','2024-02-18 00:45:00','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null'),(50,'frodo7','frodo7@gmail.com','$2b$10$x.6N0Ibqo4zo5FCJFoeHsO','$2b$10$x.6N0Ibqo4zo5FCJFoeHsOAmzJoSZfpLa0XezRKCg3zTIHH8H/6PO','2024-02-18 00:45:07','0000-00-00 00:00:00',0,0,'null','0000-00-00 00:00:00',0,'null');
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

-- Dump completed on 2024-06-22 15:40:35
