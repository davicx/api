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
) ENGINE=InnoDB AUTO_INCREMENT=1607 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_users`
--

LOCK TABLES `group_users` WRITE;
/*!40000 ALTER TABLE `group_users` DISABLE KEYS */;
INSERT INTO `group_users` VALUES (1508,70,'sam',1,'0000-00-00 00:00:00',0,'2023-11-27 00:26:27'),(1509,70,'davey',1,'0000-00-00 00:00:00',0,'2023-11-27 00:26:27'),(1510,70,'frodo',1,'0000-00-00 00:00:00',0,'2023-11-27 00:26:27'),(1511,72,'davey',1,'0000-00-00 00:00:00',0,'2023-11-27 00:34:26'),(1512,72,'sam',1,'0000-00-00 00:00:00',0,'2023-11-27 00:34:26'),(1513,72,'frodo',1,'0000-00-00 00:00:00',0,'2023-11-27 00:34:26'),(1537,539,'pippin',0,'0000-00-00 00:00:00',0,'2024-02-11 00:45:42'),(1538,539,'sam',0,'0000-00-00 00:00:00',0,'2024-02-11 00:45:42'),(1539,539,'frodo',0,'0000-00-00 00:00:00',0,'2024-02-11 00:45:42'),(1540,539,'merry',0,'0000-00-00 00:00:00',0,'2024-02-11 00:45:42'),(1541,540,'pippin',0,'0000-00-00 00:00:00',0,'2024-02-11 00:46:21'),(1542,540,'sam',0,'0000-00-00 00:00:00',0,'2024-02-11 00:46:21'),(1543,541,'davey',1,'0000-00-00 00:00:00',0,'2024-02-11 00:46:53'),(1544,541,'pippin',0,'0000-00-00 00:00:00',0,'2024-02-11 00:46:53'),(1545,541,'sam',0,'0000-00-00 00:00:00',0,'2024-02-11 00:46:53'),(1546,541,'frodo',0,'0000-00-00 00:00:00',0,'2024-02-11 00:46:53'),(1547,541,'merry',0,'0000-00-00 00:00:00',0,'2024-02-11 00:46:53'),(1548,542,'davey',1,'0000-00-00 00:00:00',0,'2024-02-11 00:47:05'),(1549,542,'pippin',0,'0000-00-00 00:00:00',0,'2024-02-11 00:47:05'),(1550,542,'sam',0,'0000-00-00 00:00:00',0,'2024-02-11 00:47:05'),(1551,542,'frodo',0,'0000-00-00 00:00:00',0,'2024-02-11 00:47:05'),(1552,542,'merry',0,'0000-00-00 00:00:00',0,'2024-02-11 00:47:05'),(1553,543,'davey',1,'0000-00-00 00:00:00',0,'2024-02-11 00:48:40'),(1554,543,'pippin',0,'0000-00-00 00:00:00',0,'2024-02-11 00:48:40'),(1555,543,'sam',0,'0000-00-00 00:00:00',0,'2024-02-11 00:48:40'),(1556,543,'frodo',0,'0000-00-00 00:00:00',0,'2024-02-11 00:48:40'),(1557,543,'merry',0,'0000-00-00 00:00:00',0,'2024-02-11 00:48:40'),(1558,544,'davey',1,'0000-00-00 00:00:00',0,'2024-02-11 00:49:24'),(1559,544,'pippin',0,'0000-00-00 00:00:00',0,'2024-02-11 00:49:24'),(1560,544,'sam',0,'0000-00-00 00:00:00',0,'2024-02-11 00:49:24'),(1561,544,'frodo',0,'0000-00-00 00:00:00',0,'2024-02-11 00:49:24'),(1562,544,'merry',0,'0000-00-00 00:00:00',0,'2024-02-11 00:49:24'),(1563,545,'davey',1,'0000-00-00 00:00:00',0,'2024-02-17 23:29:35'),(1564,546,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:25:36'),(1565,546,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:25:36'),(1566,546,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:25:36'),(1567,547,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:25:49'),(1568,547,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:25:49'),(1569,547,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:25:49'),(1570,548,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:27:26'),(1571,548,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:27:26'),(1572,549,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:28:27'),(1573,550,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:32:28'),(1574,550,'sam',0,'0000-00-00 00:00:00',0,'2024-03-03 00:32:28'),(1575,550,'merry',0,'0000-00-00 00:00:00',0,'2024-03-03 00:32:28'),(1576,550,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:32:28'),(1577,550,'pippin',0,'0000-00-00 00:00:00',0,'2024-03-03 00:32:28'),(1578,551,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:34:07'),(1579,551,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:34:07'),(1580,551,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:34:07'),(1581,551,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:34:07'),(1582,551,'frodo4',0,'0000-00-00 00:00:00',0,'2024-03-03 00:34:07'),(1583,551,'frodo5',0,'0000-00-00 00:00:00',0,'2024-03-03 00:34:07'),(1584,552,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:34:57'),(1585,553,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:34:59'),(1586,554,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:37:16'),(1587,555,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:37:55'),(1588,556,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:38:59'),(1589,556,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:38:59'),(1590,556,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:38:59'),(1591,557,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:45:36'),(1592,557,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:45:36'),(1593,557,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:45:36'),(1594,558,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:45:51'),(1595,558,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:45:51'),(1596,558,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:45:51'),(1597,558,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:45:51'),(1598,559,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:46:38'),(1599,560,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:46:44'),(1600,561,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:47:30'),(1601,561,'frodo2',0,'0000-00-00 00:00:00',0,'2024-03-03 00:47:30'),(1602,561,'frodo3',0,'0000-00-00 00:00:00',0,'2024-03-03 00:47:30'),(1603,561,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:47:30'),(1604,562,'davey',1,'0000-00-00 00:00:00',0,'2024-03-03 00:54:26'),(1605,562,'frodo',0,'0000-00-00 00:00:00',0,'2024-03-03 00:54:26'),(1606,562,'sam',0,'0000-00-00 00:00:00',0,'2024-03-03 00:54:26');
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

-- Dump completed on 2024-06-22 15:40:31