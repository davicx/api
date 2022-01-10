-- phpMyAdmin SQL Dump
-- version 4.9.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 19, 2021 at 12:58 AM
-- Server version: 10.4.10-MariaDB
-- PHP Version: 7.3.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `shareshare`
--

-- --------------------------------------------------------

--
-- Table structure for table `boards`
--

DROP TABLE IF EXISTS `boards`;
CREATE TABLE IF NOT EXISTS `boards` (
  `board_id` int(11) NOT NULL AUTO_INCREMENT,
  `board_name` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `board_type` varchar(255) NOT NULL,
  `created_by_name` varchar(255) NOT NULL,
  `is_default` int(11) DEFAULT NULL,
  `is_public` int(11) DEFAULT NULL,
  `active_status` int(11) NOT NULL,
  `recycle_status` int(11) NOT NULL,
  `updated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`board_id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `boards`
--

INSERT INTO `boards` (`board_id`, `board_name`, `group_id`, `board_type`, `created_by_name`, `is_default`, `is_public`, `active_status`, `recycle_status`, `updated`, `created`) VALUES
(1, 'hi', 321, '', 'vasquezd', NULL, NULL, 0, 0, '2019-07-30 00:08:48', '2019-07-25 21:44:32'),
(2, 'Hero', 321, '', 'vasquezd', NULL, NULL, 0, 0, '2019-07-31 20:17:49', '2019-07-30 00:12:16'),
(3, 'Our Maps', 321, '', 'vasquezd', NULL, NULL, 1, 0, '2019-07-30 20:37:37', '2019-07-30 20:37:37'),
(4, 'hi', 321, '', 'vasquezd', NULL, NULL, 0, 0, '2019-08-12 20:30:16', '2019-08-12 20:30:06'),
(5, 'hello', 321, 'post', 'vasquezd', NULL, NULL, 0, 0, '2019-08-12 20:39:51', '2019-08-12 20:31:49'),
(6, 'hiya', 321, 'post', 'vasquezd', NULL, NULL, 0, 0, '2019-08-12 20:39:49', '2019-08-12 20:32:05'),
(7, 'our game', 321, 'discussion', 'vasquezd', NULL, NULL, 0, 0, '2019-08-13 22:30:01', '2019-08-12 20:39:39'),
(8, 'hiya', 321, 'discussion', 'vasquezd', NULL, NULL, 0, 0, '2019-08-13 22:30:03', '2019-08-12 20:39:43'),
(9, 'this is new', 321, 'discussion', 'vasquezd', NULL, NULL, 1, 0, '2019-08-13 22:30:07', '2019-08-13 22:30:07'),
(10, 'our game', 321, 'discussion', 'vasquezd', NULL, NULL, 1, 0, '2019-08-14 21:42:47', '2019-08-14 21:42:47'),
(11, 'Hero', 321, 'discussion', 'becca', NULL, NULL, 1, 0, '2019-08-15 19:58:54', '2019-08-15 19:58:54');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
CREATE TABLE IF NOT EXISTS `comments` (
  `comment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL DEFAULT 0,
  `comment` text NOT NULL DEFAULT '',
  `comment_from` varchar(255) NOT NULL DEFAULT '',
  `comment_deleted` int(11) NOT NULL DEFAULT 0,
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`comment_id`, `post_id`, `comment`, `comment_from`, `comment_deleted`, `updated`, `created`) VALUES
(117, 1, 'Hiya sam! I do want to go!', 'david', 0, '2021-11-21 23:39:11', '2021-11-21 23:39:11'),
(118, 1, 'Cool how fun! ', 'sam', 0, '2021-11-21 23:39:11', '2021-11-21 23:39:11');

-- --------------------------------------------------------

--
-- Table structure for table `comments_original`
--

DROP TABLE IF EXISTS `comments_original`;
CREATE TABLE IF NOT EXISTS `comments_original` (
  `comment_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `comment_is_child` int(11) NOT NULL,
  `comment` text NOT NULL,
  `comment_from` varchar(255) NOT NULL,
  `likes` int(11) NOT NULL,
  `has_file` int(11) NOT NULL,
  `file_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_name_server` varchar(255) NOT NULL,
  `comment_deleted` int(11) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `comments_original`
--

INSERT INTO `comments_original` (`comment_id`, `group_id`, `post_id`, `comment_is_child`, `comment`, `comment_from`, `likes`, `has_file`, `file_id`, `file_name`, `file_name_server`, `comment_deleted`, `updated`, `created`) VALUES
(46, 0, 186, 0, 'This hobbit was a very well-to-do hobbit, and his name was Baggins. \n								The Bagginses had lived in the neighbourhood of The Hill for time out of mind, \n								and people considered them very respectable, not only because most of them were rich, \n								but also because they never had any adventures or did anything unexpected: \n								you could tell what a Baggins would say on any question without the bother of asking him. \n								This is a story of how a Baggins had an adventure, found himself doing and saying things \n								altogether unexpected. He may have lost the neighbours\' respect, but he gained-well, \n								you will see whether he gained anything in the end. ', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:16', '2017-03-30 22:37:27'),
(47, 0, 186, 0, 'This was bad grammar of course, but that is how beavers talk when they are excited; I mean, in Narnia--in our world they usually don\'t talk at all. ', 'sarah', 0, 0, 0, '', '', 0, '2017-04-05 23:56:42', '2016-07-08 22:37:32'),
(48, 0, 186, 0, 'It is as hard to explain how this sunlit land was different from the old Narnia as it would be to tell you how the fruits of that country taste. Perhaps you will get some idea of it if you think like this. You may have been in a room in which there was a window that looked out on a lovely bay of the sea or a green valley that wound away among mountains. ', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:19', '2016-07-08 22:37:38'),
(69, 0, 0, 0, 'lifehouse', 'vasquezd', 0, 1, 0, 'Lighthouse.jpg', '1491255927Lighthouse.jpg', 0, '2017-04-03 21:45:27', '2017-04-03 21:45:27'),
(71, 0, 0, 0, 'file', 'vasquezd', 0, 1, 0, 'Hydrangeas.jpg', '1491265119Hydrangeas.jpg', 0, '2017-04-04 00:18:39', '2017-04-04 00:18:39'),
(72, 0, 0, 1, 'this is the new child comment', 'vasquezd', 0, 1, 0, 'Tulips.jpg', '1491265606Tulips.jpg', 0, '2017-04-06 00:21:21', '2017-04-04 00:26:46'),
(73, 0, 0, 0, 'this is new', 'matt', 0, 0, 0, '', '', 1, '2017-04-06 00:21:45', '2017-04-05 00:12:08'),
(74, 0, 0, 0, 'hi', 'kristen', 0, 0, 0, '', '', 0, '2017-04-05 23:56:07', '2017-04-05 23:13:53'),
(75, 0, 0, 1, 'helo child', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:24', '2017-04-05 23:17:17'),
(76, 0, 0, 1, 'helo child', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-05 23:18:19', '2017-04-05 23:17:50'),
(77, 0, 0, 1, 'helo child', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-05 23:20:12', '2017-04-05 23:20:12'),
(78, 0, 0, 1, 'hello new child ', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:13:31', '2017-04-05 23:20:52'),
(79, 0, 0, 1, 'helo child', 'matt', 0, 0, 0, '', '', 0, '2017-04-05 23:54:48', '2017-04-05 23:25:25'),
(80, 0, 0, 1, 'helo child', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:25', '2017-04-05 23:25:31'),
(81, 0, 0, 1, 'helo child', 'brian', 0, 0, 0, '', '', 0, '2017-04-06 00:21:26', '2017-04-05 23:47:52'),
(82, 0, 0, 1, 'helo child', 'sarah', 0, 0, 0, '', '', 0, '2017-04-06 00:21:27', '2017-04-05 23:48:06'),
(83, 0, 0, 1, 'helo child', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-05 23:48:10', '2017-04-05 23:48:10'),
(84, 0, 0, 1, 'helo child', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:29', '2017-04-05 23:48:16'),
(85, 0, 0, 1, 'helo child', 'sarah', 0, 0, 0, '', '', 1, '2017-04-06 00:22:23', '2017-04-05 23:49:29'),
(86, 0, 0, 1, 'why', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:31', '2017-04-05 23:49:35'),
(87, 0, 0, 1, 'thats better ', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-05 23:49:42', '2017-04-05 23:49:42'),
(88, 0, 0, 1, 'thats better why', 'sarah', 0, 0, 0, '', '', 0, '2017-04-06 00:21:32', '2017-04-05 23:50:21'),
(89, 0, 0, 1, 'clear out', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 00:21:34', '2017-04-05 23:50:34'),
(90, 0, 0, 1, 'right now', 'sarah', 0, 0, 0, '', '', 0, '2017-04-06 00:21:35', '2017-04-05 23:50:54'),
(91, 0, 0, 1, 'hard to see down here', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-05 23:51:11', '2017-04-05 23:51:11'),
(92, 0, 0, 1, 'right?1', 'vasquezd', 0, 0, 0, '', '', 1, '2017-04-06 00:21:49', '2017-04-05 23:51:20'),
(93, 0, 0, 0, 'still work?', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 22:46:24', '2017-04-06 22:46:24'),
(94, 0, 0, 1, 'ok', 'vasquezd', 0, 0, 0, '', '', 1, '2017-04-06 23:16:52', '2017-04-06 23:14:48'),
(95, 0, 0, 0, 'this is a new comment', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 23:46:54', '2017-04-06 23:46:54'),
(96, 0, 0, 1, 'oh t otall i agree', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 23:47:26', '2017-04-06 23:47:26'),
(97, 0, 438, 0, 'this is a new comment yaya!', 'vasquezd', 0, 0, 0, '', '', 0, '2017-08-22 23:56:32', '2017-04-06 23:54:14'),
(98, 0, 0, 0, 'check out the new files I put for our game', 'vasquezd', 0, 0, 0, '', '', 0, '2017-04-06 23:54:27', '2017-04-06 23:54:27'),
(99, 0, 0, 0, 'hello what a great video', 'vasquezd', 0, 0, 0, '', '', 0, '2017-08-23 00:25:14', '2017-08-23 00:25:14'),
(100, 0, 438, 0, 'hello what a great video!!!!', 'vasquezd', 0, 0, 0, '', '', 0, '2017-08-24 00:17:03', '2017-08-23 00:26:33'),
(101, 0, 438, 0, 'This is new', 'vasquezd', 0, 0, 0, '', '', 1, '2017-08-24 00:15:03', '2017-08-23 23:19:29'),
(102, 0, 438, 0, 'Does this work?', 'vasquezd', 0, 0, 0, '', '', 0, '2017-08-31 21:09:21', '2017-08-31 21:09:21'),
(103, 0, 18, 0, 'this is cool!', 'vasquezd', 0, 0, 0, '', '', 0, '2017-10-01 23:07:17', '2017-10-01 23:07:17'),
(104, 0, 18, 0, 'ya!', 'vasquezd', 0, 0, 0, '', '', 0, '2017-10-01 23:07:41', '2017-10-01 23:07:41'),
(105, 0, 187, 0, 'hello', 'vasquezd', 0, 0, 0, '', '', 1, '2019-07-30 00:02:33', '2019-06-13 23:54:21'),
(106, 0, 187, 0, 'hi', 'vasquezd', 0, 0, 0, '', '', 1, '2019-07-30 00:03:09', '2019-06-13 23:58:36'),
(107, 0, 187, 0, 'oh', 'vasquezd', 0, 0, 0, '', '', 1, '2019-07-30 00:02:41', '2019-06-13 23:58:40'),
(108, 0, 185, 0, 'meya', 'vasquezd', 0, 0, 0, '', '', 0, '2019-06-13 23:58:45', '2019-06-13 23:58:45'),
(109, 0, 185, 0, 'hoya ', 'vasquezd', 0, 0, 0, '', '', 0, '2019-06-14 00:00:58', '2019-06-14 00:00:58'),
(110, 0, 185, 0, 'comment 1 ', 'vasquezd', 0, 0, 0, '', '', 0, '2019-06-14 00:01:08', '2019-06-14 00:01:08'),
(111, 0, 185, 0, 'comment 2', 'vasquezd', 0, 0, 0, '', '', 0, '2019-06-14 00:01:12', '2019-06-14 00:01:12'),
(112, 0, 185, 0, 'comment 3', 'vasquezd', 0, 0, 0, '', '', 0, '2019-06-14 00:01:16', '2019-06-14 00:01:16'),
(113, 0, 187, 0, 'Comment 1', 'vasquezd', 0, 0, 0, '', '', 1, '2019-07-30 00:03:12', '2019-06-14 00:01:34'),
(114, 0, 187, 0, 'Comment 2', 'vasquezd', 0, 0, 0, '', '', 1, '2019-07-30 00:03:15', '2019-06-14 00:01:38'),
(115, 0, 187, 0, 'comment 3', 'becca', 0, 0, 0, '', '', 0, '2019-06-14 20:45:20', '2019-06-14 20:45:20'),
(116, 0, 79, 0, 'hi', 'vasquezd', 0, 0, 0, '', '', 0, '2019-08-20 21:19:29', '2019-08-20 21:19:29');

-- --------------------------------------------------------

--
-- Table structure for table `comment_likes`
--

DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE IF NOT EXISTS `comment_likes` (
  `comment_like_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `liked_by` int(11) NOT NULL,
  `liked_by_name` varchar(255) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comment_like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `comment_likes`
--

INSERT INTO `comment_likes` (`comment_like_id`, `comment_id`, `liked_by`, `liked_by_name`, `updated`) VALUES
(2, 15, 2, 'matt', '2016-05-26 23:01:32'),
(4, 3, 1, 'vasquezd', '2016-05-26 23:58:44'),
(5, 13, 1, 'vasquezd', '2016-05-27 00:00:45'),
(6, 2, 1, 'vasquezd', '2016-05-27 00:00:47'),
(8, 15, 1, 'vasquezd', '2016-05-27 20:11:59'),
(9, 23, 1, 'vasquezd', '2016-05-27 20:21:04'),
(10, 22, 1, 'vasquezd', '2016-05-27 20:21:05'),
(11, 19, 1, 'vasquezd', '2016-05-27 20:21:07'),
(12, 20, 1, 'vasquezd', '2016-05-27 22:03:54'),
(14, 24, 1, 'vasquezd', '2016-05-31 00:02:53'),
(15, 25, 1, 'Vasquezd', '2016-05-31 22:29:27'),
(16, 25, 1, 'vasquezd', '2016-06-02 20:29:54'),
(17, 26, 1, 'vasquezd', '2016-06-02 20:48:21'),
(18, 40, 1, 'vasquezd', '2016-07-03 23:22:47'),
(19, 41, 1, 'vasquezd', '2016-07-03 23:22:47'),
(20, 42, 1, 'vasquezd', '2016-07-03 23:33:20'),
(21, 39, 1, 'vasquezd', '2016-07-08 22:02:26'),
(22, 45, 1, 'vasquezd', '2016-07-08 22:02:29');

-- --------------------------------------------------------

--
-- Table structure for table `comment_votes`
--

DROP TABLE IF EXISTS `comment_votes`;
CREATE TABLE IF NOT EXISTS `comment_votes` (
  `comment_vote_id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `up_vote` int(11) NOT NULL,
  `up_vote_user` varchar(255) NOT NULL,
  `down_vote` int(11) NOT NULL,
  `down_vote_user` varchar(255) NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`comment_vote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_owner` varchar(255) NOT NULL,
  `event_category` varchar(255) NOT NULL,
  `event_type` varchar(255) NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `event_description` text NOT NULL,
  `event_location` varchar(255) NOT NULL,
  `street_address_line_two` varchar(255) NOT NULL,
  `address_city` varchar(255) NOT NULL,
  `address_state` varchar(255) NOT NULL,
  `address_zip_code` int(11) NOT NULL,
  `address_country` varchar(255) NOT NULL,
  `street_address_line_one` varchar(255) NOT NULL,
  `event_image` varchar(255) NOT NULL,
  `event_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `event_created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `event_owner`, `event_category`, `event_type`, `event_name`, `event_description`, `event_location`, `street_address_line_two`, `address_city`, `address_state`, `address_zip_code`, `address_country`, `street_address_line_one`, `event_image`, `event_time`, `event_created`) VALUES
(1, 'osu_football', 'sports', 'football', 'OSU vs Utah', 'Football Game coming up!', 'Reser Stadium', '', '', '', 0, '', '', 'football.jpg', '2019-05-19 01:00:00', '2018-03-29 22:45:46'),
(2, 'osu_admissions', 'graduation', 'graduation', 'OSU Graduation', 'Graduation for 2019!', 'Reser Stadium', '', '', '', 0, '', '', 'graduation.jpg', '2019-06-15 21:00:00', '2019-05-15 22:43:54'),
(3, 'osu_mens_soccer', 'sports', 'Mens Soccer Game', 'OSU Mens Soccer vs USC', 'Soccer game, yay!', 'Corvallis', '', '', '', 0, '', '', 'soccer.jpg', '2019-06-01 00:00:00', '2019-05-15 23:22:11'),
(4, 'osu_football', 'sports', 'football', 'OSU vs Washington', 'Against The Huskies', 'Reser Stadium', '', 'Corvallis', 'Or', 97330, '', '', 'football.jpg', '2019-05-19 01:00:00', '2018-03-29 22:45:46'),
(5, 'college_business', 'entrepreneurship', 'speaker', 'Start Up Ptich', 'Come listen to companies Pitch', 'Austin Hall', '', 'Corvallis', 'Or', 97330, '', '', 'austin.jpg', '2019-06-15 21:00:00', '2019-05-15 22:43:54');

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
CREATE TABLE IF NOT EXISTS `files` (
  `file_id` int(11) NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `parent_folder` int(11) NOT NULL,
  `current_folder` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_image` varchar(255) NOT NULL,
  `file_extension` varchar(255) NOT NULL,
  `file_name_server` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `file_caption` text NOT NULL,
  `file_seen` int(11) NOT NULL,
  `file_status` int(11) NOT NULL,
  `recycle_status` int(11) NOT NULL,
  `unique_id` varchar(255) NOT NULL,
  `file_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `file_last_modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `files`
--

INSERT INTO `files` (`file_id`, `master_site`, `parent_folder`, `current_folder`, `group_id`, `post_id`, `file_name`, `file_image`, `file_extension`, `file_name_server`, `user_name`, `user_id`, `file_caption`, `file_seen`, `file_status`, `recycle_status`, `unique_id`, `file_created`, `file_last_modified`) VALUES
(165, 'shareshare', 0, 0, 321, 0, 'background_4', '1559690179background_4.png', 'png', '1559690179background_4.png', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:16:19', '2019-06-04 23:16:19'),
(166, 'shareshare', 0, 0, 321, 0, 'background_1', '1559690242background_1.jpg', 'jpg', '1559690242background_1.jpg', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:17:22', '2019-06-04 23:17:22'),
(167, 'shareshare', 0, 0, 321, 0, 'background_1', '1559690262background_1.jpg', 'jpg', '1559690262background_1.jpg', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:17:42', '2019-06-04 23:17:42'),
(168, 'shareshare', 0, 0, 321, 0, 'background_8', '1559690316background_8.jpg', 'jpg', '1559690316background_8.jpg', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:18:36', '2019-06-04 23:18:36'),
(169, 'shareshare', 0, 0, 321, 0, 'background_4', '1559690321background_4.png', 'png', '1559690321background_4.png', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:18:41', '2019-06-04 23:18:41'),
(170, 'shareshare', 0, 0, 321, 0, 'background_1', '1559690814background_1.jpg', 'jpg', '1559690814background_1.jpg', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:26:54', '2019-06-04 23:26:54'),
(171, 'shareshare', 0, 0, 321, 0, 'background_6', '1559690818background_6.jpg', 'jpg', '1559690818background_6.jpg', 'vasquezd', 1, '', 0, 1, 0, '', '2019-06-04 23:26:58', '2019-06-04 23:26:58'),
(172, 'shareshare', 0, 0, 321, 0, 'Dh1XlFBWAAAIYpL', '1565899185Dh1XlFBWAAAIYpL.jpg', 'jpg', '1565899185Dh1XlFBWAAAIYpL.jpg', 'vasquezd', 1, 'this file has a caption', 0, 0, 1, '', '2019-08-15 19:59:45', '2019-08-16 22:09:36'),
(173, 'shareshare', 0, 0, 321, 0, '1ZmrLjK', '15659018281ZmrLjK.jpg', 'jpg', '15659018281ZmrLjK.jpg', 'vasquezd', 1, 'oya', 0, 0, 1, '', '2019-08-15 20:43:48', '2019-08-16 22:09:40'),
(174, 'shareshare', 0, 0, 321, 0, '178bb1f55eb53b53512165915b540362', '1565993383178bb1f55eb53b53512165915b540362.jpg', 'jpg', '1565993383178bb1f55eb53b53512165915b540362.jpg', 'vasquezd', 1, '', 0, 0, 1, '', '2019-08-16 22:09:43', '2019-08-20 20:12:02'),
(175, 'shareshare', 0, 0, 321, 0, 'resize', '1565993973resize.jpg', 'jpg', '1565993973resize.jpg', 'vasquezd', 1, 'hiya', 0, 1, 0, '', '2019-08-16 22:19:33', '2019-08-16 22:19:33');

-- --------------------------------------------------------

--
-- Table structure for table `folders`
--

DROP TABLE IF EXISTS `folders`;
CREATE TABLE IF NOT EXISTS `folders` (
  `folder_id` int(11) NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `parent_folder` int(11) NOT NULL,
  `folder_name` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `folder_image` varchar(255) NOT NULL,
  `folder_seen` int(11) NOT NULL,
  `folder_status` int(11) NOT NULL,
  `recycle_status` int(11) NOT NULL,
  `folder_created` timestamp NOT NULL DEFAULT current_timestamp(),
  `folder_last_modified` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`folder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `folders`
--

INSERT INTO `folders` (`folder_id`, `master_site`, `group_id`, `parent_folder`, `folder_name`, `user_name`, `user_id`, `folder_image`, `folder_seen`, `folder_status`, `recycle_status`, `folder_created`, `folder_last_modified`) VALUES
(108, '', 321, 0, 'Music', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:28:57', '2019-05-10 23:28:57'),
(109, '', 321, 0, 'Movies', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:29:49', '2019-05-10 23:29:49'),
(110, '', 321, 108, 'Anberlin', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:30:45', '2019-05-10 23:30:45'),
(111, '', 321, 110, 'Cities', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:30:52', '2019-05-10 23:30:52'),
(112, '', 321, 108, 'Hammock', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:56:17', '2019-05-10 23:56:17'),
(113, '', 321, 112, 'Departure Songs', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:56:44', '2019-05-10 23:56:44'),
(114, '', 321, 112, 'Kenotic', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:56:59', '2019-05-10 23:56:59'),
(115, '', 321, 109, 'Lost', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-10 23:57:09', '2019-05-10 23:57:09'),
(116, '', 321, 0, 'Games', 'vasquezd', 1, 'folder.png', 0, 1, 0, '2019-05-15 23:43:04', '2019-05-24 22:28:47'),
(117, '', 321, 0, 'Me', 'vasquezd', 1, 'folder.png', 0, 0, 1, '2019-05-22 22:35:22', '2019-05-22 22:35:40'),
(118, '', 321, 0, 'Hi', 'vasquezd', 1, 'folder.png', 0, 0, 1, '2019-05-22 22:36:07', '2019-05-22 22:36:10'),
(119, 'shareshare', 321, 0, 'hi', 'vasquezd', 1, 'folder.png', 0, 0, 1, '2019-08-15 22:28:07', '2019-08-15 22:28:10');

-- --------------------------------------------------------

--
-- Table structure for table `followers`
--

DROP TABLE IF EXISTS `followers`;
CREATE TABLE IF NOT EXISTS `followers` (
  `following_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `follower_user_name` varchar(255) NOT NULL,
  `follower_id` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`following_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `followers`
--

INSERT INTO `followers` (`following_id`, `user_name`, `user_id`, `follower_user_name`, `follower_id`, `created`) VALUES
(28, 'vasquezd', 1, 'Becca', 6, '2019-08-26 23:29:30'),
(29, 'vasquezd', 1, 'matt', 2, '2019-08-26 23:29:55'),
(30, 'vasquezd', 1, 'brian', 3, '2019-08-26 23:29:56'),
(31, 'vasquezd', 1, 'Kristen', 4, '2019-08-26 23:29:57'),
(32, 'vasquezd', 1, 'Aimee', 5, '2019-08-26 23:29:58'),
(33, 'vasquezd', 1, 'chris', 8, '2019-08-26 23:29:59'),
(34, 'vasquezd', 1, 'Sarah', 7, '2019-08-26 23:30:00'),
(35, 'vasquezd', 1, 'davey', 10, '2019-08-26 23:30:05'),
(36, 'vasquezd', 1, 'pop', 9, '2019-08-26 23:30:06');

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
CREATE TABLE IF NOT EXISTS `friends` (
  `friends_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `friend_user_name` varchar(255) NOT NULL,
  `friend_id` int(11) NOT NULL,
  `request_pending` int(11) NOT NULL,
  `friend_key` varchar(255) NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`friends_id`)
) ENGINE=InnoDB AUTO_INCREMENT=354 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `friends`
--

INSERT INTO `friends` (`friends_id`, `user_name`, `user_id`, `friend_user_name`, `friend_id`, `request_pending`, `friend_key`, `created`) VALUES
(342, 'vasquezd', 1, 'matt', 2, 0, 'vasquezdmatt', '2019-02-20 00:10:41'),
(343, 'matt', 2, 'vasquezd', 1, 0, 'mattvasquezd', '2019-02-20 00:10:41'),
(344, 'vasquezd', 1, 'brian', 3, 1, 'vasquezdbrian', '2019-02-19 22:06:22'),
(345, 'brian', 3, 'vasquezd', 1, 1, 'brianvasquezd', '2019-02-19 22:06:22'),
(346, 'vasquezd', 1, 'Kristen', 4, 0, 'vasquezdKristen', '2019-02-20 00:11:30'),
(347, 'Kristen', 4, 'vasquezd', 1, 0, 'Kristenvasquezd', '2019-02-20 00:11:30'),
(348, 'vasquezd', 1, 'Aimee', 5, 1, 'vasquezdAimee', '2019-02-19 22:06:25'),
(349, 'Aimee', 5, 'vasquezd', 1, 1, 'Aimeevasquezd', '2019-02-19 22:06:25'),
(350, 'vasquezd', 1, 'Becca', 6, 0, 'vasquezdBecca', '2019-02-20 00:11:05'),
(351, 'Becca', 6, 'vasquezd', 1, 0, 'Beccavasquezd', '2019-02-20 00:11:05'),
(352, 'vasquezd', 1, 'Sarah', 7, 0, 'vasquezdSarah', '2019-04-06 23:13:29'),
(353, 'Sarah', 7, 'vasquezd', 1, 0, 'Sarahvasquezd', '2019-04-06 23:13:29');

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
CREATE TABLE IF NOT EXISTS `groups` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_type` varchar(255) NOT NULL DEFAULT 'normal',
  `created_by` varchar(255) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `group_image` varchar(255) NOT NULL DEFAULT 'group.png',
  `group_key` varchar(255) NOT NULL DEFAULT 'nokey',
  `group_private` int(11) NOT NULL DEFAULT 1,
  `group_deleted` int(11) NOT NULL DEFAULT 0,
  `updated` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=402 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `groups_events`
--

DROP TABLE IF EXISTS `groups_events`;
CREATE TABLE IF NOT EXISTS `groups_events` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(255) NOT NULL,
  `group_type` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `group_image` varchar(255) NOT NULL,
  `group_deleted` int(11) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=343 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `groups_events`
--

INSERT INTO `groups_events` (`group_id`, `group_name`, `group_type`, `created_by`, `group_image`, `group_deleted`, `updated`, `created`) VALUES
(339, 'osu_football', 'sports', 'vasquezd', 'football.jpg', 0, '0000-00-00 00:00:00', '2019-05-15 23:18:34'),
(340, 'osu_admissions', 'campus', 'vasquezd', 'admissions.jpg', 0, '0000-00-00 00:00:00', '2019-05-15 23:18:34'),
(341, 'osu_mens_soccer', 'sports', 'vasquezd', 'soccer.jpg', 0, '0000-00-00 00:00:00', '2019-05-15 23:20:54'),
(342, 'college_business', 'college', 'vasquezd', 'business.jpg', 0, '0000-00-00 00:00:00', '2019-05-15 23:18:34');

-- --------------------------------------------------------

--
-- Table structure for table `group_followers`
--

DROP TABLE IF EXISTS `group_followers`;
CREATE TABLE IF NOT EXISTS `group_followers` (
  `primary_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `active_member` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`primary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `group_followers`
--

INSERT INTO `group_followers` (`primary_id`, `group_name`, `group_id`, `user_name`, `user_id`, `active_member`, `created`, `updated`) VALUES
(1, 'osu_admissions', 340, 'vasquezd', 1, 1, '2019-05-15 23:19:58', '2019-05-15 07:00:00'),
(2, 'osu_football', 339, 'vasquezd', 1, 1, '2019-05-15 23:19:58', '2019-05-15 07:00:00'),
(3, 'osu_football', 339, 'matt', 2, 1, '2019-05-15 23:19:58', '2019-05-15 07:00:00'),
(4, 'osu_volleyball', 1, 'vasquezd', 5, 1, '2019-08-21 21:37:14', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `group_users`
--

DROP TABLE IF EXISTS `group_users`;
CREATE TABLE IF NOT EXISTS `group_users` (
  `primary_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `active_member` int(11) NOT NULL,
  `group_last_visit` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_default_group` int(11) NOT NULL DEFAULT 0,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`primary_id`)
) ENGINE=InnoDB AUTO_INCREMENT=996 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `links`
--

DROP TABLE IF EXISTS `links`;
CREATE TABLE IF NOT EXISTS `links` (
  `link_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `folder_name` varchar(255) NOT NULL,
  `parent` int(11) NOT NULL,
  `is_folder` int(11) NOT NULL,
  `link_url` varchar(2083) NOT NULL,
  `link_title` text NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `link_from` varchar(255) NOT NULL,
  `link_image` varchar(255) NOT NULL,
  `link_favicon` varchar(255) NOT NULL,
  `link_type` varchar(255) NOT NULL,
  `caption` text NOT NULL,
  `tag_id` int(11) NOT NULL,
  `likes` int(11) NOT NULL,
  `unique_id` varchar(255) NOT NULL,
  `link_status` int(11) NOT NULL,
  `recycle_status` int(11) NOT NULL,
  `square_id` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`link_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `list`
--

DROP TABLE IF EXISTS `list`;
CREATE TABLE IF NOT EXISTS `list` (
  `list_primary_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `list_id` int(11) NOT NULL,
  `list_image` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_privilege` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `shared_with` varchar(255) NOT NULL,
  `list_type` varchar(255) NOT NULL,
  `list_name` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `unique_key` varchar(255) NOT NULL,
  `is_default` int(11) NOT NULL,
  `active_status` int(11) NOT NULL,
  `public_status` int(11) NOT NULL,
  `recycle_status` int(11) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`list_primary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `list_users`
--

DROP TABLE IF EXISTS `list_users`;
CREATE TABLE IF NOT EXISTS `list_users` (
  `primary_id` int(11) NOT NULL AUTO_INCREMENT,
  `list_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_privilege` varchar(255) NOT NULL,
  `active_member` int(11) NOT NULL,
  `updated` timestamp NULL DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`primary_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL DEFAULT 0,
  `notification_from` varchar(255) NOT NULL,
  `notification_to` varchar(255) NOT NULL,
  `notification_type` varchar(255) NOT NULL,
  `notification_message` varchar(255) NOT NULL,
  `notification_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `notification_link` varchar(255) NOT NULL,
  `notification_seen` int(11) NOT NULL DEFAULT 0,
  `notification_deleted` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1842 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `master_site`, `group_id`, `notification_from`, `notification_to`, `notification_type`, `notification_message`, `notification_time`, `notification_link`, `notification_seen`, `notification_deleted`) VALUES
(1840, 'kite', 401, 'davey', 'sam', 'group_invite', 'Invited you to a new Group', '2021-12-19 00:51:35', 'http://localhost:3003/group/77', 0, 1),
(1841, 'kite', 401, 'davey', 'frodo', 'group_invite', 'Invited you to a new Group', '2021-12-19 00:51:35', 'http://localhost:3003/group/77', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications_original`
--

DROP TABLE IF EXISTS `notifications_original`;
CREATE TABLE IF NOT EXISTS `notifications_original` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `status_unseen` int(11) NOT NULL,
  `notification_from` varchar(255) NOT NULL,
  `notification_to` varchar(255) NOT NULL,
  `notification_type` varchar(255) NOT NULL,
  `notification_message` varchar(255) NOT NULL,
  `notification_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `full_link` varchar(255) NOT NULL,
  `link_url` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `list_id` int(11) NOT NULL,
  `from_logged_in_user` int(11) NOT NULL,
  `notification_count` int(11) NOT NULL,
  `notification_deleted` int(11) NOT NULL,
  `clicked` int(11) NOT NULL,
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1622 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `notifications_original`
--

INSERT INTO `notifications_original` (`notification_id`, `master_site`, `status_unseen`, `notification_from`, `notification_to`, `notification_type`, `notification_message`, `notification_time`, `full_link`, `link_url`, `group_id`, `list_id`, `from_logged_in_user`, `notification_count`, `notification_deleted`, `clicked`) VALUES
(1587, 'shareshare', 1, 'vasquezd', 'matt', 'group_discussion', 'added to a group discussion ', '2019-08-23 22:57:18', 'groups_discussion.php?group_id=MzIx', 'groups_discussion.php?group_id=MzIx', 321, 0, 0, 7, 0, 0),
(1614, 'shareshare', 1, 'vasquezd', 'Kristen', 'new_post_photo', 'shared a photo', '2019-08-21 19:55:27', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1615, 'shareshare', 1, 'vasquezd', 'Becca', 'new_post_photo', 'shared a photo', '2019-08-21 19:55:27', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1616, 'shareshare', 1, 'vasquezd', 'matt', 'new_post_video', 'shared a video', '2019-08-23 22:56:30', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1617, 'shareshare', 1, 'vasquezd', 'Kristen', 'new_post_video', 'shared a video', '2019-08-23 22:56:30', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1618, 'shareshare', 1, 'vasquezd', 'Becca', 'new_post_video', 'shared a video', '2019-08-23 22:56:30', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1619, 'shareshare', 1, 'vasquezd', 'matt', 'new_post_photo', 'shared a photo', '2019-08-23 22:56:50', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1620, 'shareshare', 1, 'vasquezd', 'Kristen', 'new_post_photo', 'shared a photo', '2019-08-23 22:56:50', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0),
(1621, 'shareshare', 1, 'vasquezd', 'Becca', 'new_post_photo', 'shared a photo', '2019-08-23 22:56:50', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 'http://localhost/sites/template/site_files/groups_posts.php?group_id=MzIx', 321, 0, 0, 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `pending_email`
--

DROP TABLE IF EXISTS `pending_email`;
CREATE TABLE IF NOT EXISTS `pending_email` (
  `primary_id` int(11) NOT NULL AUTO_INCREMENT,
  `codehash` varchar(255) NOT NULL,
  `request_from` varchar(255) NOT NULL,
  `request_to` varchar(255) NOT NULL,
  `request_to_existing_user` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `square_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `list_id` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  PRIMARY KEY (`primary_id`),
  UNIQUE KEY `codehash` (`codehash`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `pending_requests`
--

DROP TABLE IF EXISTS `pending_requests`;
CREATE TABLE IF NOT EXISTS `pending_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) NOT NULL,
  `request_type` varchar(255) NOT NULL,
  `request_type_text` varchar(255) NOT NULL,
  `request_is_pending` int(11) NOT NULL,
  `sent_by` varchar(255) NOT NULL,
  `sent_to` varchar(255) NOT NULL,
  `request_key` varchar(255) NOT NULL DEFAULT 'key',
  `sent_to_email` varchar(255) NOT NULL DEFAULT 'false',
  `friend_id` int(11) NOT NULL DEFAULT 0,
  `group_id` int(11) NOT NULL DEFAULT 0,
  `list_id` int(11) NOT NULL DEFAULT 0,
  `updated` timestamp NOT NULL DEFAULT current_timestamp(),
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB AUTO_INCREMENT=781 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `pending_requests`
--

INSERT INTO `pending_requests` (`request_id`, `master_site`, `request_type`, `request_type_text`, `request_is_pending`, `sent_by`, `sent_to`, `request_key`, `sent_to_email`, `friend_id`, `group_id`, `list_id`, `updated`, `created`) VALUES
(779, 'kite', 'new_group', 'invited you to join a group', 1, 'davey', 'frodo', 'key', 'false', 0, 401, 0, '2021-12-19 00:51:35', '2021-12-19 00:51:35'),
(780, 'kite', 'new_group', 'invited you to join a group', 1, 'davey', 'sam', 'key', 'false', 0, 401, 0, '2021-12-19 00:51:35', '2021-12-19 00:51:35');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
CREATE TABLE IF NOT EXISTS `posts` (
  `post_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) DEFAULT 'kite',
  `post_type` varchar(255) DEFAULT 'none',
  `post_status` int(11) NOT NULL DEFAULT 1,
  `group_id` int(11) NOT NULL DEFAULT 0,
  `list_id` int(11) DEFAULT 0,
  `post_from` varchar(255) NOT NULL DEFAULT 'empty',
  `post_to` varchar(2083) NOT NULL DEFAULT 'empty',
  `post_caption` varchar(255) DEFAULT 'emp',
  `file_name` varchar(255) DEFAULT '',
  `file_name_server` varchar(255) DEFAULT 'hiya.jpg',
  `file_url` varchar(255) DEFAULT 'empty',
  `video_url` varchar(255) DEFAULT 'empty',
  `video_code` varchar(255) DEFAULT 'empty',
  `updated` timestamp NOT NULL DEFAULT current_timestamp(),
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=257 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`post_id`, `master_site`, `post_type`, `post_status`, `group_id`, `list_id`, `post_from`, `post_to`, `post_caption`, `file_name`, `file_name_server`, `file_url`, `video_url`, `video_code`, `updated`, `created`) VALUES
(254, 'kite', 'text', 1, 77, 0, 'davey', 'frodo', 'Hiya Frodo!! The weather is perfect! wanna hike or we could garden!', '', 'hiya.jpg', 'empty', 'empty', 'empty', '2021-12-19 00:14:03', '2021-12-19 00:14:03'),
(255, 'kite', 'video', 1, 77, 0, 'davey', 'frodo', 'Hiya!! Check out this Video!', '', 'hiya.jpg', 'empty', 'https://www.youtube.com/watch?v=niCMpOkMcWU', 'niCMpOkMcWU', '2021-12-19 00:14:29', '2021-12-19 00:14:29'),
(256, 'Kite', 'photo', 1, 77, 0, 'davey', '77', 'Hiya Sam!! ', '', 'hiya.jpg', 'empty', 'empty', 'empty', '2021-12-19 00:15:31', '2021-12-19 00:15:31');

-- --------------------------------------------------------

--
-- Table structure for table `posts_full`
--

DROP TABLE IF EXISTS `posts_full`;
CREATE TABLE IF NOT EXISTS `posts_full` (
  `post_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `master_site` varchar(255) DEFAULT NULL,
  `post_type` varchar(255) DEFAULT 'none',
  `post_status` int(11) NOT NULL DEFAULT 0,
  `parent` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `board_id` int(11) NOT NULL,
  `list_id` int(11) NOT NULL,
  `post_from` varchar(255) NOT NULL,
  `post_to` varchar(2083) NOT NULL,
  `post_caption` text NOT NULL,
  `post_url` varchar(255) NOT NULL,
  `post_url_caption` varchar(255) NOT NULL,
  `video_code` varchar(255) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_name_server` varchar(255) NOT NULL,
  `article_title` varchar(255) NOT NULL,
  `article_text` text NOT NULL,
  `contains_file` int(11) NOT NULL,
  `unique_id` varchar(255) NOT NULL,
  `comment_seen` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`post_id`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `posts_full`
--

INSERT INTO `posts_full` (`post_id`, `master_site`, `post_type`, `post_status`, `parent`, `group_id`, `board_id`, `list_id`, `post_from`, `post_to`, `post_caption`, `post_url`, `post_url_caption`, `video_code`, `image_url`, `file_url`, `file_name`, `file_name_server`, `article_title`, `article_text`, `contains_file`, `unique_id`, `comment_seen`, `updated`, `created`) VALUES
(143, 'kite', 'text', 0, 0, 0, 0, 0, 'davey', '77', 'Hi sam this is new! Do you wanna garden today again! The weather is perfect! Or we could hike!', '', '', '', '', '', '', '', '', '', 0, '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(144, 'kite', 'text', 0, 0, 0, 0, 0, 'davey', '77', 'Hi frodo do you wanna garden today?! The weather is perfect! Or we could fish!', '', '', '', '', '', '', '', '', '', 0, '', '0000-00-00 00:00:00', '0000-00-00 00:00:00', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
CREATE TABLE IF NOT EXISTS `post_likes` (
  `post_like_id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `liked_by` int(11) NOT NULL,
  `liked_by_name` varchar(255) NOT NULL,
  `time_stamp` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`post_like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `post_likes`
--

INSERT INTO `post_likes` (`post_like_id`, `post_id`, `liked_by`, `liked_by_name`, `time_stamp`) VALUES
(66, 187, 2, 'matt', '2019-06-12 00:06:30'),
(67, 187, 6, 'becca', '2019-06-12 00:06:30'),
(68, 187, 7, 'sarah', '2019-06-12 00:06:30'),
(69, 186, 1, 'vasquezd', '2019-06-12 21:58:22'),
(70, 185, 1, 'vasquezd', '2019-06-12 21:58:23'),
(74, 187, 4, 'kristen', '2019-06-12 22:04:54'),
(75, 186, 4, 'kristen', '2019-06-12 22:04:57'),
(76, 185, 4, 'kristen', '2019-06-12 22:04:58'),
(77, 184, 4, 'kristen', '2019-06-12 22:05:00'),
(79, 183, 1, 'vasquezd', '2019-06-12 22:12:55'),
(83, 187, 1, 'vasquezd', '2019-07-30 00:03:20'),
(84, 211, 1, 'vasquezd', '2019-08-06 21:22:43'),
(85, 20, 1, 'vasquezd', '2019-08-07 22:44:13'),
(86, 30, 1, 'vasquezd', '2019-08-09 21:02:27');

-- --------------------------------------------------------

--
-- Table structure for table `user_analytics`
--

DROP TABLE IF EXISTS `user_analytics`;
CREATE TABLE IF NOT EXISTS `user_analytics` (
  `analytics_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `page_url` varchar(255) NOT NULL,
  `last_visit` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `total_visits` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `icon_id` varchar(255) NOT NULL,
  `last_click` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_clicks` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  PRIMARY KEY (`analytics_id`)
) ENGINE=InnoDB AUTO_INCREMENT=355 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_analytics`
--

INSERT INTO `user_analytics` (`analytics_id`, `user_name`, `page_url`, `last_visit`, `total_visits`, `group_id`, `icon_id`, `last_click`, `total_clicks`, `user_id`) VALUES
(351, 'vasquezd', 'groups.php', '2018-02-02 00:19:18', 17, 0, '', '2018-04-02 23:23:16', 0, 0),
(352, 'vasquezd', '', '0000-00-00 00:00:00', 0, 0, 'js-activity-group-icon', '2018-02-22 23:34:05', 4, 0),
(353, 'vasquezd', '', '0000-00-00 00:00:00', 0, 0, 'js-notification-header-seen', '2018-02-22 23:34:04', 4, 0),
(354, 'Vasquezd', 'group_posts.php', '2018-03-27 21:20:28', 11, 330, '', '2018-03-27 21:24:41', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_login`
--

DROP TABLE IF EXISTS `user_login`;
CREATE TABLE IF NOT EXISTS `user_login` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(15) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `salt` int(11) NOT NULL,
  `password` varchar(40) NOT NULL,
  `last_login` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_logout` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `login_total` int(11) NOT NULL,
  `account_deleted` int(11) NOT NULL,
  `password_reset_key` varchar(255) NOT NULL,
  `password_reset_sent` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `password_reset_used` int(11) NOT NULL,
  `password_reset_status` varchar(255) NOT NULL,
  UNIQUE KEY `user_id_2` (`user_id`),
  UNIQUE KEY `user_name` (`user_name`),
  UNIQUE KEY `user_name_2` (`user_name`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_login`
--

INSERT INTO `user_login` (`user_id`, `user_name`, `user_email`, `salt`, `password`, `last_login`, `last_logout`, `login_total`, `account_deleted`, `password_reset_key`, `password_reset_sent`, `password_reset_used`, `password_reset_status`) VALUES
(1, 'vasquezd', 'vasquezd@onid.orst.edu', 1494015793, 'c3be883dd5822f892141e642962084d6be47c2bf', '2021-11-05 23:51:08', '2019-08-26 23:30:25', 950, 0, 'A2XMVdcf3SNCMpkIJQqxbnSOfPcGIHul', '2017-05-06 03:28:32', 0, '1'),
(2, 'matt', '', 1448946249, 'de85ef10d2853b10978ac6c8e0c37c354d3b6969', '2019-06-04 22:33:50', '2017-11-09 07:53:13', 117, 0, '', '0000-00-00 00:00:00', 0, ''),
(3, 'brian', '', 1448946380, 'ace622215c315ce82bfd153b63c7faeb218a17da', '2017-05-19 07:05:25', '2017-05-19 07:06:50', 10, 0, '', '0000-00-00 00:00:00', 0, ''),
(4, 'Kristen', '', 1448946380, 'e3ae7af8145e258b854728fc9cebe6c8891ee2a5', '2019-06-12 23:01:46', '2017-11-09 07:54:16', 19, 0, '', '0000-00-00 00:00:00', 0, ''),
(5, 'Aimee', '', 1448946380, '33f916c66f61bbf37a12105c8bb3e0fc8ea75fd6', '2017-10-20 04:38:11', '2016-11-06 04:11:01', 16, 0, '', '0000-00-00 00:00:00', 0, ''),
(6, 'Becca', '', 1448946503, 'ba342a034cc175fb24a1c3d59d190da0c31f0106', '2019-08-15 20:08:06', '2019-08-15 20:08:06', 31, 0, '', '0000-00-00 00:00:00', 0, ''),
(7, 'Sarah', '', 1448946503, '378d32da508020f682a238053fec6f307e0aa30a', '2019-05-03 22:29:15', '2017-07-25 06:26:11', 5, 0, '', '0000-00-00 00:00:00', 0, ''),
(8, 'chris', '', 1448946380, '80c96f63d24bc38382aca981ed2e262c22582605', '2016-10-02 03:31:31', '2016-10-02 03:31:45', 1, 0, '', '0000-00-00 00:00:00', 0, ''),
(9, 'pop', '', 1448946503, '851b0d429828f520537e2323a1c5f1cde21eee5d', '2015-12-01 13:31:10', '2015-12-01 13:31:10', 0, 0, '', '0000-00-00 00:00:00', 0, ''),
(10, 'davey', 'david@gmail.com', 1509399816, '04e2fb7d672370d9f7b1929917debb010fa504b9', '2017-10-31 04:43:42', '0000-00-00 00:00:00', 1, 0, '', '0000-00-00 00:00:00', 0, ''),
(11, 'mynewme', 'vsaque@oregonstate.edu', 1566333763, '9391807882add564e57ab8229208db248af24167', '2019-08-20 20:43:08', '2019-08-20 20:43:08', 1, 0, '', '0000-00-00 00:00:00', 0, '');

-- --------------------------------------------------------

--
-- Table structure for table `user_profile`
--

DROP TABLE IF EXISTS `user_profile`;
CREATE TABLE IF NOT EXISTS `user_profile` (
  `user_profile_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `image_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `root_folder` varchar(255) NOT NULL,
  `biography` text NOT NULL,
  `university` varchar(50) NOT NULL,
  `post_view` varchar(255) NOT NULL,
  `updated` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_profile_id`),
  UNIQUE KEY `user_name` (`user_name`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_profile`
--

INSERT INTO `user_profile` (`user_profile_id`, `user_id`, `user_name`, `email`, `image_name`, `first_name`, `last_name`, `root_folder`, `biography`, `university`, `post_view`, `updated`, `created`) VALUES
(46, 1, 'vasquezd', 'Vasquezd@onid.orst.edu', '12.jpg', 'David', 'Vasquez', 'Vasquezd', 'My Biography', 'Oregon State ', 'large', '2016-04-04 04:33:50', '2014-08-22 01:00:05'),
(47, 2, 'matt', 'vasquezm@shareshare.com', 'matt.jpg', 'Matt', 'Vasquez', '', 'This is matts page!', '', '', '2015-12-01 12:55:10', '0000-00-00 00:00:00'),
(48, 3, 'brian', 'vasquezb@shareshare.com', '13.jpg', 'Brian', 'Vasquez', '', 'this is brian\'s page! ', '', '', '2016-04-10 04:02:59', '0000-00-00 00:00:00'),
(49, 4, 'Kristen', 'vasquezj@shareshare.com', 'david.jpg', 'Kristen', 'Vasquez', '', 'this is my page!', '', '', '2015-12-03 11:25:43', '0000-00-00 00:00:00'),
(50, 5, 'Aimee', 'Aimeeaileen@mac.com', '11.jpg', 'Aimee', 'Vasquez', 'Vasquez', 'They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \n	making a noise like elephants which they can hear a mile off <- Not your bio change it here', '', '', '2015-12-07 16:28:40', '0000-00-00 00:00:00'),
(51, 6, 'Becca', '', 'Becca.jpg', 'Becca', 'Vasquez', 'vasquezma', 'They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \r\n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \r\n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \r\n	making a noise like elephants which they can hear a mile off <- Not your bio change it here', '', '', '2016-04-10 04:03:19', '0000-00-00 00:00:00'),
(52, 7, 'Sarah', '', '11.jpg', 'Sarah', 'Vasquez', 'Vasquezbb', 'They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \r\n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \r\n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \r\n	making a noise like elephants which they can hear a mile off <- Not your bio change it here', '', '', '2015-12-01 12:57:23', '0000-00-00 00:00:00'),
(53, 8, 'chris', 'californiachristophe@gmail.com', '1450307134Screen.jpg', 'Chris', 'Vasquez', 'Vasquezdk', 'They are (or were) a little people, about half our height, and smaller than the bearded dwarves. \n	Hobbits have no beards. There is little or no magic about them except the ordinary everyday sort which helps \n	them to disappear quietly and quickly when large stupid folk like you and me come blundering along, \n	making a noise like elephants which they can hear a mile off <- Not your bio change it here', '', '', '2015-12-17 07:05:34', '0000-00-00 00:00:00'),
(73, 0, '', '', '', 'frodo', 'bag', '', '', '', '', '0000-00-00 00:00:00', '2020-05-22 23:28:38'),
(74, 0, 'will', '', '', 'will', 'work', '', '', '', '', '0000-00-00 00:00:00', '2020-05-22 23:30:56');

-- --------------------------------------------------------

--
-- Table structure for table `user_size`
--

DROP TABLE IF EXISTS `user_size`;
CREATE TABLE IF NOT EXISTS `user_size` (
  `primary_key` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `birthday` varchar(255) NOT NULL,
  `street_address_line_one` varchar(255) NOT NULL,
  `street_address_line_two` varchar(255) NOT NULL,
  `address_city` varchar(255) NOT NULL,
  `address_state` varchar(255) NOT NULL,
  `address_zip_code` varchar(255) NOT NULL,
  `address_country` varchar(255) NOT NULL,
  `user_shirt` varchar(255) NOT NULL,
  `user_sweater` varchar(255) NOT NULL,
  `user_coat` varchar(255) NOT NULL,
  `user_jeans` varchar(255) NOT NULL,
  `user_pants` varchar(255) NOT NULL,
  `user_dress_size` varchar(255) NOT NULL,
  `user_shoes` varchar(255) NOT NULL,
  `user_info` text NOT NULL,
  PRIMARY KEY (`primary_key`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_size`
--

INSERT INTO `user_size` (`primary_key`, `user_name`, `user_id`, `gender`, `birthday`, `street_address_line_one`, `street_address_line_two`, `address_city`, `address_state`, `address_zip_code`, `address_country`, `user_shirt`, `user_sweater`, `user_coat`, `user_jeans`, `user_pants`, `user_dress_size`, `user_shoes`, `user_info`) VALUES
(1, 'vasquezd', 1, 'Male', 'December 3', '155 NW Kings', '', 'Corvallis', 'Oregon', '', '', 'medium', 'medium', 'medium', '34 x 30', '', '', '12', ''),
(2, 'vasquezb', 3, '', 'May 28', '', '', '', '', '', '', 'large', 'large', 'medium or large', '34 x 30 or 33 x 30', '', '', '12', ''),
(3, 'chris', 8, '', 'March', '', '', '', '', '', '', 'XL', 'XL', '', '38 by 34', '', '', '11', ''),
(4, 'pop', 9, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(5, 'Sarah', 7, '', '', 'sarah', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(6, 'Becca', 6, '', '', 'becca', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(7, 'Aimee', 5, '', '11/22/83', '', '', '', '', '', '', 'Girl large or extra large/ guy small', 'Girl large/ guy small or medium ', '', '', '', '', '', ''),
(8, 'Kristen', 4, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(9, 'Brian', 3, '', '', 'brian', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(10, 'matt', 2, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(11, 'davey', 10, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''),
(12, 'mynewme', 11, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
