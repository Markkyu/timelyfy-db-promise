-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 02, 2025 at 07:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `timelyfydb`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `generateRoomSchedule` (IN `p_room_id` VARCHAR(50), IN `p_room_name` VARCHAR(100))   BEGIN
    DECLARE id_increment_slot INT DEFAULT 0; -- start from 1 (7:00 AM)
    DECLARE id_increment_day INT DEFAULT 0;  -- 0 = Monday

    -- Loop through 5 days (Monday to Friday)
    WHILE id_increment_day < 5 DO
        INSERT INTO `room_schedules`
            (`room_id`, `room_name`, `slot_day`, `slot_time`, `slot_course`)
        VALUES
            (p_room_id, p_room_name, id_increment_day, id_increment_slot, '0');

        -- Move to next time slot
        SET id_increment_slot = id_increment_slot + 1;

        -- If time slot reaches end of day (8:30 PM), move to next day
        IF id_increment_slot = 27 THEN
            SET id_increment_day = id_increment_day + 1;
            SET id_increment_slot = 0;
        END IF;
    END WHILE;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `generateTeacherSchedule` (IN `new_teacher_id` INT)   BEGIN
    DECLARE id_increment_slot INT DEFAULT 0;  -- start at 0 (7:00 AM)
    DECLARE id_increment_day INT DEFAULT 0;   -- 0 = Monday

    -- Loop through 5 days (Monday to Friday)
    WHILE id_increment_day < 5 DO
        INSERT INTO teacher_schedules (
            teacher_id,
            slot_day,
            slot_time,
            slot_course
        )
        VALUES (
            new_teacher_id,
            id_increment_day,
            id_increment_slot,
            0
        );

        -- Move to next time slot
        SET id_increment_slot = id_increment_slot + 1;

        -- If time slot reaches end of day (8:30 PM), move to next day
        IF id_increment_slot = 27 THEN
            SET id_increment_day = id_increment_day + 1;
            SET id_increment_slot = 0;
        END IF;
    END WHILE;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `colleges`
--

CREATE TABLE `colleges` (
  `college_id` int(11) NOT NULL,
  `college_name` text NOT NULL,
  `college_major` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `colleges`
--

INSERT INTO `colleges` (`college_id`, `college_name`, `college_major`) VALUES
(1, 'Computer Science', ''),
(2, 'Computer Engineering', ''),
(3, 'Psychology', ''),
(5, 'Nursing', ''),
(7, 'Elementary Education', ''),
(8, 'Tourism Management', ''),
(9, 'Accountancy', ''),
(47, 'Secondary Education', 'Major in Mathematics'),
(48, 'Hospitality Management', ''),
(51, 'Secondary Education', 'Major in Science'),
(52, 'Secondary Education', 'Major in Social Studies'),
(53, 'Secondary Education', 'Major in English'),
(54, 'Business Administration', 'Major in Financial Management'),
(55, 'Business Administration', 'Human Resource Development Management'),
(56, 'Business Administration', 'Marketing Management');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `course_surrogate_id` int(11) NOT NULL,
  `course_id` varchar(22) DEFAULT NULL,
  `course_code` varchar(10) NOT NULL,
  `course_name` text NOT NULL,
  `hours_week` int(11) NOT NULL,
  `course_year` int(11) NOT NULL,
  `course_college` int(11) NOT NULL,
  `semester` int(11) NOT NULL,
  `assigned_teacher` int(11) DEFAULT NULL,
  `assigned_room` int(11) DEFAULT NULL,
  `is_plotted` tinyint(1) NOT NULL,
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`course_surrogate_id`, `course_id`, `course_code`, `course_name`, `hours_week`, `course_year`, `course_college`, `semester`, `assigned_teacher`, `assigned_room`, `is_plotted`, `created_by`) VALUES
(67, 'CS_IC101', 'IC101', 'Introduction to Computing', 3, 1, 1, 1, 36, 6, 0, 1),
(68, 'CS_EIS102', 'EIS102', 'The Family', 3, 1, 1, 1, NULL, NULL, 0, 1),
(69, 'CS_GEL105', 'GEL105', 'English Enhancement Course', 3, 1, 1, 1, NULL, NULL, 0, 1),
(73, 'CS_NSTP101', 'NSTP101', 'Civic Welfare Training Service 1', 3, 1, 1, 1, NULL, NULL, 0, 1);

--
-- Triggers `courses`
--
DELIMITER $$
CREATE TRIGGER `trg_generate_course_id` BEFORE INSERT ON `courses` FOR EACH ROW BEGIN
    DECLARE base_id VARCHAR(100);
    DECLARE duplicate_count INT DEFAULT 0;
    DECLARE college_name VARCHAR(100);
    DECLARE college_major VARCHAR(100);
    DECLARE college_abbrev VARCHAR(20) DEFAULT '';
    DECLARE major_abbrev VARCHAR(20) DEFAULT '';

    -- ✅ Only run if course_id is NULL or empty
    IF NEW.course_id IS NULL OR TRIM(NEW.course_id) = '' THEN

        -- ✅ Fetch college name and major safely
        SELECT c.college_name, c.college_major
        INTO college_name, college_major
        FROM colleges AS c
        WHERE c.college_id = NEW.course_college
        LIMIT 1;

        -- ✅ Guard if no college found
        IF college_name IS NULL THEN
            SET college_name = 'GEN';
        END IF;

        -- ✅ Get initials from college name
        WHILE LOCATE(' ', college_name) > 0 DO
            SET college_abbrev = CONCAT(college_abbrev, LEFT(college_name, 1));
            SET college_name = SUBSTRING(college_name, LOCATE(' ', college_name) + 1);
        END WHILE;
        SET college_abbrev = CONCAT(college_abbrev, LEFT(college_name, 1));

        -- ✅ Extract initials from college_major if any
        IF college_major IS NOT NULL AND TRIM(college_major) <> '' THEN
            SET college_major = TRIM(REPLACE(college_major, 'Major in', ''));
            WHILE LOCATE(' ', college_major) > 0 DO
                SET major_abbrev = CONCAT(major_abbrev, LEFT(college_major, 1));
                SET college_major = SUBSTRING(college_major, LOCATE(' ', college_major) + 1);
            END WHILE;
            SET major_abbrev = CONCAT(major_abbrev, LEFT(college_major, 1));
        END IF;

        -- ✅ Construct the base ID
        IF major_abbrev <> '' THEN
            SET base_id = CONCAT(UPPER(college_abbrev), '-', UPPER(major_abbrev), '_', REPLACE(NEW.course_code, ' ', ''));
        ELSE
            SET base_id = CONCAT(UPPER(college_abbrev), '_', REPLACE(NEW.course_code, ' ', ''));
        END IF;

        -- ✅ Check for duplicates
        SELECT COUNT(*) INTO duplicate_count
        FROM courses
        WHERE course_id LIKE CONCAT(base_id, '%');

        -- ✅ Assign generated ID
        IF duplicate_count = 0 THEN
            SET NEW.course_id = base_id;
        ELSE
            SET NEW.course_id = CONCAT(base_id, '-', CHAR(64 + duplicate_count + 1));
        END IF;

    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `majors`
--

CREATE TABLE `majors` (
  `major_id` int(11) NOT NULL,
  `college_ref` int(11) NOT NULL,
  `major_name` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phase_control`
--

CREATE TABLE `phase_control` (
  `phase_id` int(11) NOT NULL,
  `phase_year` int(11) NOT NULL,
  `phase_sem` int(11) NOT NULL,
  `phase_supervisor` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `phase_control`
--

INSERT INTO `phase_control` (`phase_id`, `phase_year`, `phase_sem`, `phase_supervisor`) VALUES
(1, 1, 1, 'master_scheduler');

-- --------------------------------------------------------

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` int(11) NOT NULL,
  `username` text NOT NULL,
  `password` text NOT NULL DEFAULT 'user',
  `role` enum('admin','master_scheduler','super_user','user') NOT NULL DEFAULT 'user',
  `email` varchar(50) NOT NULL,
  `full_name` varchar(50) NOT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  `change_password` enum('no','pending','approved') DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `profiles`
--

INSERT INTO `profiles` (`id`, `username`, `password`, `role`, `email`, `full_name`, `created_at`, `change_password`) VALUES
(1, 'Markkyu', '$2b$10$T9ASbi5wdDhRCjGYpa6yPesMnU6qf0/.ldb4vjiDcYin96sF4Utrm', 'admin', 'marcbaldozjoel@gmail.com', 'Marc Joel Baldoz', '2025-10-20', 'approved'),
(4, 'frenzy', '$2b$10$OVRW.gQr.QtD1cEWDXUjCOICDLCk9oq7Qf5egjEV64nr6xDjTmoi.', 'super_user', '', '', '2025-10-18', 'no'),
(5, 'vernie', '$2b$10$UoiheGdo88pDsM.jI41.mOXRaVwk8CEXoPk5LcXQtrjVm77xPaMs6', 'master_scheduler', '', '', '2025-10-18', 'no'),
(6, 'admin', '$2b$10$TTIgNemUoQtSon1OOtRs4OfFlBlq3HpuTUtrB8CqecQtdJUBlZYxi', 'admin', '', '', '2025-10-18', 'pending'),
(11, 'master', '$2b$10$Gkur1F5DsOW1ntmw4RdOAetMcpajTfqywejILZJ0kcstlIQUjbqu2', 'master_scheduler', '', '', '2025-10-20', 'no'),
(15, 'user', '$2b$10$0V4J/amrKrsCDChYNy.m.O5.QNYdGKPRW8gdoBc0niF2dCFjoiy/m', 'user', '', '', '2025-10-22', 'no'),
(22, 'annpar', '$2b$10$jU7T1iTYNt6Q5QdKYgfj2OPFL8LFBGYdZ/kRMmH7bYRy/EMrTZ/nW', 'user', '', '', '2025-11-02', 'no');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `room_name` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `room_name`) VALUES
(6, 'testing room');

--
-- Triggers `rooms`
--
DELIMITER $$
CREATE TRIGGER `after_room_insert` AFTER INSERT ON `rooms` FOR EACH ROW BEGIN
    CALL generateRoomSchedule(NEW.room_id, NEW.room_name);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `room_schedules`
--

CREATE TABLE `room_schedules` (
  `room_schedule_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `room_name` varchar(100) NOT NULL,
  `slot_day` int(11) NOT NULL,
  `slot_time` int(11) NOT NULL,
  `slot_course` varchar(100) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room_schedules`
--

INSERT INTO `room_schedules` (`room_schedule_id`, `room_id`, `room_name`, `slot_day`, `slot_time`, `slot_course`) VALUES
(538, 6, 'testing room', 0, 0, '0'),
(539, 6, 'testing room', 0, 1, '0'),
(540, 6, 'testing room', 0, 2, '0'),
(541, 6, 'testing room', 0, 3, '0'),
(542, 6, 'testing room', 0, 4, '0'),
(543, 6, 'testing room', 0, 5, '0'),
(544, 6, 'testing room', 0, 6, '0'),
(545, 6, 'testing room', 0, 7, '0'),
(546, 6, 'testing room', 0, 8, '0'),
(547, 6, 'testing room', 0, 9, '0'),
(548, 6, 'testing room', 0, 10, '2'),
(549, 6, 'testing room', 0, 11, '2'),
(550, 6, 'testing room', 0, 12, '0'),
(551, 6, 'testing room', 0, 13, '0'),
(552, 6, 'testing room', 0, 14, '0'),
(553, 6, 'testing room', 0, 15, '0'),
(554, 6, 'testing room', 0, 16, '0'),
(555, 6, 'testing room', 0, 17, '0'),
(556, 6, 'testing room', 0, 18, '0'),
(557, 6, 'testing room', 0, 19, '0'),
(558, 6, 'testing room', 0, 20, '0'),
(559, 6, 'testing room', 0, 21, '0'),
(560, 6, 'testing room', 0, 22, '0'),
(561, 6, 'testing room', 0, 23, '0'),
(562, 6, 'testing room', 0, 24, '0'),
(563, 6, 'testing room', 0, 25, '0'),
(564, 6, 'testing room', 0, 26, '0'),
(565, 6, 'testing room', 1, 0, '0'),
(566, 6, 'testing room', 1, 1, '0'),
(567, 6, 'testing room', 1, 2, '0'),
(568, 6, 'testing room', 1, 3, '0'),
(569, 6, 'testing room', 1, 4, '0'),
(570, 6, 'testing room', 1, 5, '0'),
(571, 6, 'testing room', 1, 6, '0'),
(572, 6, 'testing room', 1, 7, '0'),
(573, 6, 'testing room', 1, 8, '0'),
(574, 6, 'testing room', 1, 9, '0'),
(575, 6, 'testing room', 1, 10, '2'),
(576, 6, 'testing room', 1, 11, '2'),
(577, 6, 'testing room', 1, 12, '0'),
(578, 6, 'testing room', 1, 13, '0'),
(579, 6, 'testing room', 1, 14, '0'),
(580, 6, 'testing room', 1, 15, '0'),
(581, 6, 'testing room', 1, 16, '0'),
(582, 6, 'testing room', 1, 17, '0'),
(583, 6, 'testing room', 1, 18, '0'),
(584, 6, 'testing room', 1, 19, '0'),
(585, 6, 'testing room', 1, 20, '0'),
(586, 6, 'testing room', 1, 21, '0'),
(587, 6, 'testing room', 1, 22, '0'),
(588, 6, 'testing room', 1, 23, '0'),
(589, 6, 'testing room', 1, 24, '0'),
(590, 6, 'testing room', 1, 25, '0'),
(591, 6, 'testing room', 1, 26, '0'),
(592, 6, 'testing room', 2, 0, '0'),
(593, 6, 'testing room', 2, 1, '0'),
(594, 6, 'testing room', 2, 2, '0'),
(595, 6, 'testing room', 2, 3, '0'),
(596, 6, 'testing room', 2, 4, '0'),
(597, 6, 'testing room', 2, 5, '0'),
(598, 6, 'testing room', 2, 6, '0'),
(599, 6, 'testing room', 2, 7, '0'),
(600, 6, 'testing room', 2, 8, '0'),
(601, 6, 'testing room', 2, 9, '0'),
(602, 6, 'testing room', 2, 10, '2'),
(603, 6, 'testing room', 2, 11, '2'),
(604, 6, 'testing room', 2, 12, '0'),
(605, 6, 'testing room', 2, 13, '0'),
(606, 6, 'testing room', 2, 14, '0'),
(607, 6, 'testing room', 2, 15, '0'),
(608, 6, 'testing room', 2, 16, '0'),
(609, 6, 'testing room', 2, 17, '0'),
(610, 6, 'testing room', 2, 18, '0'),
(611, 6, 'testing room', 2, 19, '0'),
(612, 6, 'testing room', 2, 20, '0'),
(613, 6, 'testing room', 2, 21, '0'),
(614, 6, 'testing room', 2, 22, '0'),
(615, 6, 'testing room', 2, 23, '0'),
(616, 6, 'testing room', 2, 24, '0'),
(617, 6, 'testing room', 2, 25, '0'),
(618, 6, 'testing room', 2, 26, '0'),
(619, 6, 'testing room', 3, 0, '0'),
(620, 6, 'testing room', 3, 1, '0'),
(621, 6, 'testing room', 3, 2, '0'),
(622, 6, 'testing room', 3, 3, '0'),
(623, 6, 'testing room', 3, 4, '0'),
(624, 6, 'testing room', 3, 5, '0'),
(625, 6, 'testing room', 3, 6, '0'),
(626, 6, 'testing room', 3, 7, '0'),
(627, 6, 'testing room', 3, 8, '0'),
(628, 6, 'testing room', 3, 9, '0'),
(629, 6, 'testing room', 3, 10, '2'),
(630, 6, 'testing room', 3, 11, '2'),
(631, 6, 'testing room', 3, 12, '0'),
(632, 6, 'testing room', 3, 13, '0'),
(633, 6, 'testing room', 3, 14, '0'),
(634, 6, 'testing room', 3, 15, '0'),
(635, 6, 'testing room', 3, 16, '0'),
(636, 6, 'testing room', 3, 17, '0'),
(637, 6, 'testing room', 3, 18, '0'),
(638, 6, 'testing room', 3, 19, '0'),
(639, 6, 'testing room', 3, 20, '0'),
(640, 6, 'testing room', 3, 21, '0'),
(641, 6, 'testing room', 3, 22, '0'),
(642, 6, 'testing room', 3, 23, '0'),
(643, 6, 'testing room', 3, 24, '0'),
(644, 6, 'testing room', 3, 25, '0'),
(645, 6, 'testing room', 3, 26, '0'),
(646, 6, 'testing room', 4, 0, '0'),
(647, 6, 'testing room', 4, 1, '0'),
(648, 6, 'testing room', 4, 2, '0'),
(649, 6, 'testing room', 4, 3, '0'),
(650, 6, 'testing room', 4, 4, '0'),
(651, 6, 'testing room', 4, 5, '0'),
(652, 6, 'testing room', 4, 6, '0'),
(653, 6, 'testing room', 4, 7, '0'),
(654, 6, 'testing room', 4, 8, '0'),
(655, 6, 'testing room', 4, 9, '0'),
(656, 6, 'testing room', 4, 10, '2'),
(657, 6, 'testing room', 4, 11, '2'),
(658, 6, 'testing room', 4, 12, '0'),
(659, 6, 'testing room', 4, 13, '0'),
(660, 6, 'testing room', 4, 14, '0'),
(661, 6, 'testing room', 4, 15, '0'),
(662, 6, 'testing room', 4, 16, '0'),
(663, 6, 'testing room', 4, 17, '0'),
(664, 6, 'testing room', 4, 18, '0'),
(665, 6, 'testing room', 4, 19, '0'),
(666, 6, 'testing room', 4, 20, '0'),
(667, 6, 'testing room', 4, 21, '0'),
(668, 6, 'testing room', 4, 22, '0'),
(669, 6, 'testing room', 4, 23, '0'),
(670, 6, 'testing room', 4, 24, '0'),
(671, 6, 'testing room', 4, 25, '0'),
(672, 6, 'testing room', 4, 26, '0');

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `schedule_id` int(11) NOT NULL,
  `time_start` varchar(50) NOT NULL,
  `course_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `college_id` int(11) NOT NULL,
  `year_level` int(11) NOT NULL,
  `semester` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `teacher_id` int(11) NOT NULL,
  `first_name` text NOT NULL,
  `last_name` text NOT NULL,
  `department` int(11) DEFAULT NULL,
  `teacher_availability` enum('full','custom') NOT NULL DEFAULT 'full'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`teacher_id`, `first_name`, `last_name`, `department`, `teacher_availability`) VALUES
(1, 'Aldwin', 'Ilumin', 1, 'full'),
(2, 'Wishiel', 'Ilumin', 1, 'full'),
(3, 'Karen', 'Hermosa', 1, 'full'),
(4, 'Noelyn', 'Sebua', 1, 'full'),
(5, 'Virgilio', 'Abarquez', 2, 'full'),
(24, 'Wishikola', 'Hamburguesa', 1, 'full'),
(25, 'Aldwinaka', 'Bottomesa', 1, 'full'),
(36, 'Binangkal', 'Balls', NULL, 'full'),
(37, 'Marc Joel', 'Baldoz', NULL, 'full');

--
-- Triggers `teachers`
--
DELIMITER $$
CREATE TRIGGER `after_teacher_insert` AFTER INSERT ON `teachers` FOR EACH ROW BEGIN
    CALL generateTeacherSchedule(NEW.teacher_id);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `teacher_assigned_room`
--

CREATE TABLE `teacher_assigned_room` (
  `teacher_room_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teacher_assigned_room`
--

INSERT INTO `teacher_assigned_room` (`teacher_room_id`, `teacher_id`, `room_id`) VALUES
(1, 36, 6);

-- --------------------------------------------------------

--
-- Table structure for table `teacher_schedules`
--

CREATE TABLE `teacher_schedules` (
  `teacher_schedule_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `slot_day` int(11) NOT NULL,
  `slot_time` int(11) NOT NULL,
  `slot_course` varchar(255) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `teacher_schedules`
--

INSERT INTO `teacher_schedules` (`teacher_schedule_id`, `teacher_id`, `slot_day`, `slot_time`, `slot_course`) VALUES
(276, 36, 0, 0, '0'),
(277, 36, 0, 1, '0'),
(278, 36, 0, 2, '0'),
(279, 36, 0, 3, '0'),
(280, 36, 0, 4, '0'),
(281, 36, 0, 5, '0'),
(282, 36, 0, 6, '0'),
(283, 36, 0, 7, '0'),
(284, 36, 0, 8, '0'),
(285, 36, 0, 9, '0'),
(286, 36, 0, 10, '2'),
(287, 36, 0, 11, '2'),
(288, 36, 0, 12, '0'),
(289, 36, 0, 13, '0'),
(290, 36, 0, 14, '0'),
(291, 36, 0, 15, '0'),
(292, 36, 0, 16, '0'),
(293, 36, 0, 17, '0'),
(294, 36, 0, 18, '0'),
(295, 36, 0, 19, '0'),
(296, 36, 0, 20, '0'),
(297, 36, 0, 21, '0'),
(298, 36, 0, 22, '0'),
(299, 36, 0, 23, '0'),
(300, 36, 0, 24, '0'),
(301, 36, 0, 25, '0'),
(302, 36, 0, 26, '0'),
(303, 36, 1, 0, '0'),
(304, 36, 1, 1, '0'),
(305, 36, 1, 2, '0'),
(306, 36, 1, 3, '0'),
(307, 36, 1, 4, '0'),
(308, 36, 1, 5, '0'),
(309, 36, 1, 6, '0'),
(310, 36, 1, 7, '0'),
(311, 36, 1, 8, '0'),
(312, 36, 1, 9, '0'),
(313, 36, 1, 10, '2'),
(314, 36, 1, 11, '2'),
(315, 36, 1, 12, '0'),
(316, 36, 1, 13, '0'),
(317, 36, 1, 14, '0'),
(318, 36, 1, 15, '0'),
(319, 36, 1, 16, '0'),
(320, 36, 1, 17, '0'),
(321, 36, 1, 18, '0'),
(322, 36, 1, 19, '0'),
(323, 36, 1, 20, '0'),
(324, 36, 1, 21, '0'),
(325, 36, 1, 22, '0'),
(326, 36, 1, 23, '0'),
(327, 36, 1, 24, '0'),
(328, 36, 1, 25, '0'),
(329, 36, 1, 26, '0'),
(330, 36, 2, 0, '0'),
(331, 36, 2, 1, '0'),
(332, 36, 2, 2, '0'),
(333, 36, 2, 3, '0'),
(334, 36, 2, 4, '0'),
(335, 36, 2, 5, '0'),
(336, 36, 2, 6, '0'),
(337, 36, 2, 7, '0'),
(338, 36, 2, 8, '0'),
(339, 36, 2, 9, '0'),
(340, 36, 2, 10, '2'),
(341, 36, 2, 11, '2'),
(342, 36, 2, 12, '0'),
(343, 36, 2, 13, '0'),
(344, 36, 2, 14, '0'),
(345, 36, 2, 15, '0'),
(346, 36, 2, 16, '0'),
(347, 36, 2, 17, '0'),
(348, 36, 2, 18, '0'),
(349, 36, 2, 19, '0'),
(350, 36, 2, 20, '0'),
(351, 36, 2, 21, '0'),
(352, 36, 2, 22, '0'),
(353, 36, 2, 23, '0'),
(354, 36, 2, 24, '0'),
(355, 36, 2, 25, '0'),
(356, 36, 2, 26, '0'),
(357, 36, 3, 0, '0'),
(358, 36, 3, 1, '0'),
(359, 36, 3, 2, '0'),
(360, 36, 3, 3, '0'),
(361, 36, 3, 4, '0'),
(362, 36, 3, 5, '0'),
(363, 36, 3, 6, '0'),
(364, 36, 3, 7, '0'),
(365, 36, 3, 8, '0'),
(366, 36, 3, 9, '0'),
(367, 36, 3, 10, '2'),
(368, 36, 3, 11, '2'),
(369, 36, 3, 12, '0'),
(370, 36, 3, 13, '0'),
(371, 36, 3, 14, '0'),
(372, 36, 3, 15, '0'),
(373, 36, 3, 16, '0'),
(374, 36, 3, 17, '0'),
(375, 36, 3, 18, '0'),
(376, 36, 3, 19, '0'),
(377, 36, 3, 20, '0'),
(378, 36, 3, 21, '0'),
(379, 36, 3, 22, '0'),
(380, 36, 3, 23, '0'),
(381, 36, 3, 24, '0'),
(382, 36, 3, 25, '0'),
(383, 36, 3, 26, '0'),
(384, 36, 4, 0, '0'),
(385, 36, 4, 1, '0'),
(386, 36, 4, 2, '0'),
(387, 36, 4, 3, '0'),
(388, 36, 4, 4, '0'),
(389, 36, 4, 5, '0'),
(390, 36, 4, 6, '0'),
(391, 36, 4, 7, '0'),
(392, 36, 4, 8, '0'),
(393, 36, 4, 9, '0'),
(394, 36, 4, 10, '2'),
(395, 36, 4, 11, '2'),
(396, 36, 4, 12, '0'),
(397, 36, 4, 13, '0'),
(398, 36, 4, 14, '0'),
(399, 36, 4, 15, '0'),
(400, 36, 4, 16, '0'),
(401, 36, 4, 17, '0'),
(402, 36, 4, 18, '0'),
(403, 36, 4, 19, '0'),
(404, 36, 4, 20, '0'),
(405, 36, 4, 21, '0'),
(406, 36, 4, 22, '0'),
(407, 36, 4, 23, '0'),
(408, 36, 4, 24, '0'),
(409, 36, 4, 25, '0'),
(410, 36, 4, 26, '0'),
(411, 37, 0, 0, '0'),
(412, 37, 0, 1, '0'),
(413, 37, 0, 2, '0'),
(414, 37, 0, 3, '0'),
(415, 37, 0, 4, '0'),
(416, 37, 0, 5, '0'),
(417, 37, 0, 6, '0'),
(418, 37, 0, 7, '0'),
(419, 37, 0, 8, '0'),
(420, 37, 0, 9, '0'),
(421, 37, 0, 10, '2'),
(422, 37, 0, 11, '2'),
(423, 37, 0, 12, '0'),
(424, 37, 0, 13, '0'),
(425, 37, 0, 14, '0'),
(426, 37, 0, 15, '0'),
(427, 37, 0, 16, '0'),
(428, 37, 0, 17, '0'),
(429, 37, 0, 18, '0'),
(430, 37, 0, 19, '0'),
(431, 37, 0, 20, '0'),
(432, 37, 0, 21, '0'),
(433, 37, 0, 22, '0'),
(434, 37, 0, 23, '0'),
(435, 37, 0, 24, '0'),
(436, 37, 0, 25, '0'),
(437, 37, 0, 26, '0'),
(438, 37, 1, 0, '0'),
(439, 37, 1, 1, '0'),
(440, 37, 1, 2, '0'),
(441, 37, 1, 3, '0'),
(442, 37, 1, 4, '0'),
(443, 37, 1, 5, '0'),
(444, 37, 1, 6, '0'),
(445, 37, 1, 7, '0'),
(446, 37, 1, 8, '0'),
(447, 37, 1, 9, '0'),
(448, 37, 1, 10, '2'),
(449, 37, 1, 11, '2'),
(450, 37, 1, 12, '0'),
(451, 37, 1, 13, '0'),
(452, 37, 1, 14, '0'),
(453, 37, 1, 15, '0'),
(454, 37, 1, 16, '0'),
(455, 37, 1, 17, '0'),
(456, 37, 1, 18, '0'),
(457, 37, 1, 19, '0'),
(458, 37, 1, 20, '0'),
(459, 37, 1, 21, '0'),
(460, 37, 1, 22, '0'),
(461, 37, 1, 23, '0'),
(462, 37, 1, 24, '0'),
(463, 37, 1, 25, '0'),
(464, 37, 1, 26, '0'),
(465, 37, 2, 0, '0'),
(466, 37, 2, 1, '0'),
(467, 37, 2, 2, '0'),
(468, 37, 2, 3, '0'),
(469, 37, 2, 4, '0'),
(470, 37, 2, 5, '0'),
(471, 37, 2, 6, '0'),
(472, 37, 2, 7, '0'),
(473, 37, 2, 8, '0'),
(474, 37, 2, 9, '0'),
(475, 37, 2, 10, '2'),
(476, 37, 2, 11, '2'),
(477, 37, 2, 12, '0'),
(478, 37, 2, 13, '0'),
(479, 37, 2, 14, '0'),
(480, 37, 2, 15, '0'),
(481, 37, 2, 16, '0'),
(482, 37, 2, 17, '0'),
(483, 37, 2, 18, '0'),
(484, 37, 2, 19, '0'),
(485, 37, 2, 20, '0'),
(486, 37, 2, 21, '0'),
(487, 37, 2, 22, '0'),
(488, 37, 2, 23, '0'),
(489, 37, 2, 24, '0'),
(490, 37, 2, 25, '0'),
(491, 37, 2, 26, '0'),
(492, 37, 3, 0, '0'),
(493, 37, 3, 1, '0'),
(494, 37, 3, 2, '0'),
(495, 37, 3, 3, '0'),
(496, 37, 3, 4, '0'),
(497, 37, 3, 5, '0'),
(498, 37, 3, 6, '0'),
(499, 37, 3, 7, '0'),
(500, 37, 3, 8, '0'),
(501, 37, 3, 9, '0'),
(502, 37, 3, 10, '2'),
(503, 37, 3, 11, '2'),
(504, 37, 3, 12, '0'),
(505, 37, 3, 13, '0'),
(506, 37, 3, 14, '0'),
(507, 37, 3, 15, '0'),
(508, 37, 3, 16, '0'),
(509, 37, 3, 17, '0'),
(510, 37, 3, 18, '0'),
(511, 37, 3, 19, '0'),
(512, 37, 3, 20, '0'),
(513, 37, 3, 21, '0'),
(514, 37, 3, 22, '0'),
(515, 37, 3, 23, '0'),
(516, 37, 3, 24, '0'),
(517, 37, 3, 25, '0'),
(518, 37, 3, 26, '0'),
(519, 37, 4, 0, '0'),
(520, 37, 4, 1, '0'),
(521, 37, 4, 2, '0'),
(522, 37, 4, 3, '0'),
(523, 37, 4, 4, '0'),
(524, 37, 4, 5, '0'),
(525, 37, 4, 6, '0'),
(526, 37, 4, 7, '0'),
(527, 37, 4, 8, '0'),
(528, 37, 4, 9, '0'),
(529, 37, 4, 10, '2'),
(530, 37, 4, 11, '2'),
(531, 37, 4, 12, '0'),
(532, 37, 4, 13, '0'),
(533, 37, 4, 14, '0'),
(534, 37, 4, 15, '0'),
(535, 37, 4, 16, '0'),
(536, 37, 4, 17, '0'),
(537, 37, 4, 18, '0'),
(538, 37, 4, 19, '0'),
(539, 37, 4, 20, '0'),
(540, 37, 4, 21, '0'),
(541, 37, 4, 22, '0'),
(542, 37, 4, 23, '0'),
(543, 37, 4, 24, '0'),
(544, 37, 4, 25, '0'),
(545, 37, 4, 26, '0');

-- --------------------------------------------------------

--
-- Table structure for table `user_programs`
--

CREATE TABLE `user_programs` (
  `user_id` int(11) NOT NULL,
  `program_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_programs`
--

INSERT INTO `user_programs` (`user_id`, `program_id`) VALUES
(15, 1),
(15, 2),
(15, 8),
(22, 9),
(22, 51);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `colleges`
--
ALTER TABLE `colleges`
  ADD PRIMARY KEY (`college_id`),
  ADD UNIQUE KEY `UC_College` (`college_name`,`college_major`) USING HASH;

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`course_surrogate_id`),
  ADD KEY `assigned_teacher` (`assigned_teacher`),
  ADD KEY `fk_course_creator` (`created_by`);

--
-- Indexes for table `majors`
--
ALTER TABLE `majors`
  ADD PRIMARY KEY (`major_id`);

--
-- Indexes for table `phase_control`
--
ALTER TABLE `phase_control`
  ADD PRIMARY KEY (`phase_id`);

--
-- Indexes for table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`);

--
-- Indexes for table `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD PRIMARY KEY (`room_schedule_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `course_id` (`course_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `college_id` (`college_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`teacher_id`),
  ADD UNIQUE KEY `first_name` (`first_name`,`last_name`) USING HASH;

--
-- Indexes for table `teacher_assigned_room`
--
ALTER TABLE `teacher_assigned_room`
  ADD PRIMARY KEY (`teacher_room_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `teacher_schedules`
--
ALTER TABLE `teacher_schedules`
  ADD PRIMARY KEY (`teacher_schedule_id`),
  ADD KEY `fk_teacher_schedules_teachers` (`teacher_id`);

--
-- Indexes for table `user_programs`
--
ALTER TABLE `user_programs`
  ADD PRIMARY KEY (`user_id`,`program_id`),
  ADD KEY `program_id` (`program_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `colleges`
--
ALTER TABLE `colleges`
  MODIFY `college_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `course_surrogate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `majors`
--
ALTER TABLE `majors`
  MODIFY `major_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `phase_control`
--
ALTER TABLE `phase_control`
  MODIFY `phase_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `room_schedules`
--
ALTER TABLE `room_schedules`
  MODIFY `room_schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=673;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=315;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `teacher_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `teacher_assigned_room`
--
ALTER TABLE `teacher_assigned_room`
  MODIFY `teacher_room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `teacher_schedules`
--
ALTER TABLE `teacher_schedules`
  MODIFY `teacher_schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=681;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`assigned_teacher`) REFERENCES `teachers` (`teacher_id`),
  ADD CONSTRAINT `fk_course_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `room_schedules`
--
ALTER TABLE `room_schedules`
  ADD CONSTRAINT `fk_room_schedules_rooms` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`course_surrogate_id`),
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`),
  ADD CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`college_id`);

--
-- Constraints for table `teacher_assigned_room`
--
ALTER TABLE `teacher_assigned_room`
  ADD CONSTRAINT `teacher_assigned_room_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`),
  ADD CONSTRAINT `teacher_assigned_room_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

--
-- Constraints for table `teacher_schedules`
--
ALTER TABLE `teacher_schedules`
  ADD CONSTRAINT `fk_teacher_schedules_teachers` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_programs`
--
ALTER TABLE `user_programs`
  ADD CONSTRAINT `user_programs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_programs_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `colleges` (`college_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
