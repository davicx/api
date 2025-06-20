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
) ENGINE=InnoDB AUTO_INCREMENT=1667 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_users`
--

LOCK TABLES `group_users` WRITE;
/*!40000 ALTER TABLE `group_users` DISABLE KEYS */;
INSERT INTO `group_users` VALUES (1508,70,'sam',1,'0000-00-00 00:00:00',0,'2023-11-27 00:26:27'),(1509,70,'davey',1,'0000-00-00 00:00:00',0,'2023-11-27 00:26:27'),(1510,70,'frodo',1,'0000-00-00 00:00:00',0,'2023-11-27 00:26:27'),(1511,72,'davey',1,'0000-00-00 00:00:00',0,'2023-11-27 00:34:26'),(1512,72,'sam',1,'0000-00-00 00:00:00',0,'2023-11-27 00:34:26'),(1513,72,'frodo',1,'0000-00-00 00:00:00',0,'2023-11-27 00:34:26'),(1612,564,'davey',1,'0000-00-00 00:00:00',0,'2025-02-18 00:01:32'),(1613,564,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-18 00:01:32'),(1614,564,'merry',0,'0000-00-00 00:00:00',0,'2025-02-18 00:01:32'),(1615,564,'sam',0,'0000-00-00 00:00:00',0,'2025-02-18 00:01:32'),(1616,564,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-18 00:01:32'),(1617,565,'davey',1,'0000-00-00 00:00:00',0,'2025-02-18 00:14:45'),(1618,565,'merry',0,'0000-00-00 00:00:00',0,'2025-02-18 00:14:45'),(1619,565,'sam',0,'0000-00-00 00:00:00',0,'2025-02-18 00:14:45'),(1620,565,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-18 00:14:45'),(1621,565,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-18 00:14:45'),(1622,566,'davey',1,'0000-00-00 00:00:00',0,'2025-02-20 01:07:55'),(1623,566,'merry',0,'0000-00-00 00:00:00',0,'2025-02-20 01:07:55'),(1624,566,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-20 01:07:55'),(1625,566,'sam',0,'0000-00-00 00:00:00',0,'2025-02-20 01:07:55'),(1626,566,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-20 01:07:55'),(1627,567,'davey',1,'0000-00-00 00:00:00',0,'2025-02-21 00:32:38'),(1628,567,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-21 00:32:38'),(1629,567,'sam',0,'0000-00-00 00:00:00',0,'2025-02-21 00:32:38'),(1630,567,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-21 00:32:38'),(1631,567,'merry',0,'0000-00-00 00:00:00',0,'2025-02-21 00:32:38'),(1632,568,'davey',1,'0000-00-00 00:00:00',0,'2025-02-25 23:27:03'),(1633,568,'sam',0,'0000-00-00 00:00:00',0,'2025-02-25 23:27:03'),(1634,568,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-25 23:27:03'),(1635,568,'merry',0,'0000-00-00 00:00:00',0,'2025-02-25 23:27:03'),(1636,568,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-25 23:27:03'),(1637,569,'davey',1,'0000-00-00 00:00:00',0,'2025-02-27 22:53:31'),(1638,569,'sam',0,'0000-00-00 00:00:00',0,'2025-02-27 22:53:31'),(1639,569,'merry',0,'0000-00-00 00:00:00',0,'2025-02-27 22:53:31'),(1640,569,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-27 22:53:31'),(1641,569,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-27 22:53:31'),(1642,570,'davey',1,'0000-00-00 00:00:00',0,'2025-02-28 23:34:27'),(1643,570,'sam',0,'0000-00-00 00:00:00',0,'2025-02-28 23:34:27'),(1644,570,'merry',0,'0000-00-00 00:00:00',0,'2025-02-28 23:34:27'),(1645,570,'frodo',0,'0000-00-00 00:00:00',0,'2025-02-28 23:34:27'),(1646,570,'pippin',0,'0000-00-00 00:00:00',0,'2025-02-28 23:34:27'),(1647,571,'davey',1,'0000-00-00 00:00:00',0,'2025-03-05 00:38:13'),(1648,571,'sam',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:13'),(1649,571,'pippin',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:13'),(1650,571,'frodo',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:13'),(1651,571,'merry',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:13'),(1652,572,'davey',1,'0000-00-00 00:00:00',0,'2025-03-05 00:38:20'),(1653,572,'sam',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:20'),(1654,572,'merry',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:20'),(1655,572,'frodo',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:20'),(1656,572,'pippin',0,'0000-00-00 00:00:00',0,'2025-03-05 00:38:20'),(1657,573,'davey',1,'0000-00-00 00:00:00',0,'2025-03-06 00:24:01'),(1658,573,'frodo',0,'0000-00-00 00:00:00',0,'2025-03-06 00:24:01'),(1659,573,'pippin',0,'0000-00-00 00:00:00',0,'2025-03-06 00:24:01'),(1660,573,'sam',0,'0000-00-00 00:00:00',0,'2025-03-06 00:24:01'),(1661,573,'merry',0,'0000-00-00 00:00:00',0,'2025-03-06 00:24:01'),(1662,574,'davey',1,'0000-00-00 00:00:00',0,'2025-03-07 23:43:57'),(1663,574,'sam',0,'0000-00-00 00:00:00',0,'2025-03-07 23:43:57'),(1664,574,'merry',0,'0000-00-00 00:00:00',0,'2025-03-07 23:43:57'),(1665,574,'frodo',0,'0000-00-00 00:00:00',0,'2025-03-07 23:43:57'),(1666,574,'pippin',0,'0000-00-00 00:00:00',0,'2025-03-07 23:43:57');
/*!40000 ALTER TABLE `group_users` ENABLE KEYS */;
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
