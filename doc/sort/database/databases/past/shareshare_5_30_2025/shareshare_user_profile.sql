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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profile`
--

LOCK TABLES `user_profile` WRITE;
/*!40000 ALTER TABLE `user_profile` DISABLE KEYS */;
INSERT INTO `user_profile` VALUES (1,1,'davey','davey@gmail.com','frodo.jpg','david','v2','davey','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-profile-us-west-two','public/kite-profile-us-west-two/profileImage-1748475444666-649191507-background_2.png','http://localhost:3003/kite-profile-us-west-two/profileImage-1748475444666-649191507-background_2.png','background_2.png','profileImage-1748475444666-649191507-background_2.png','osu','',1,'2025-01-28 00:45:08','2025-01-28 00:45:08'),(2,2,'frodo','frodo@gmail.com','frodo.jpg','frodo','v','frodo','my new bio!','local','kite-profile-us-west-two','public/kite-profile-us-west-two/profileImage-1738197769905-76408829-1594506843background_1.jpg','http://localhost:3003/kite-profile-us-west-two/profileImage-1738197769905-76408829-1594506843background_1.jpg','1594506843background_1.jpg','profileImage-1738197769905-76408829-1594506843background_1.jpg','osu','',1,'2025-01-30 00:21:46','2025-01-30 00:21:46'),(5,5,'pippin','pippin@gmail.com','frodo.jpg','Pippin','BrandyBuck','pippin','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-profile-us-west-two','public/kite-profile-us-west-two/profileImage-1748475610744-101974712-76909388_p0.jpg','http://localhost:3003/kite-profile-us-west-two/profileImage-1748475610744-101974712-76909388_p0.jpg','76909388_p0.jpg','profileImage-1748475610744-101974712-76909388_p0.jpg','osu','',1,'2025-05-11 23:21:03','2025-05-11 23:21:03'),(6,6,'merry','merry@gmail.com','frodo.jpg','Merry','BrandyBuck','merry','They are (or were) a little people, about half our height, and smaller than the bearded dwarves','local','kite-profile-us-west-two','public/kite-profile-us-west-two/profileImage-1748475571075-367915099-IMG_3737.JPG','http://localhost:3003/kite-profile-us-west-two/profileImage-1748475571075-367915099-IMG_3737.JPG','IMG_3737.JPG','profileImage-1748475571075-367915099-IMG_3737.JPG','osu','',1,'2025-05-11 23:21:12','2025-05-11 23:21:12');
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

-- Dump completed on 2025-05-30 16:22:06
