/*
Copyright (c) 2026 Sepio Corp. All Rights Reserved.

This software and its associated documentation files (the "Software") 
are the sole and exclusive property of Sepio Corp. Unauthorized copying, 
modification, distribution, or use of this Software is strictly prohibited.

Sepio Corp retains all intellectual property rights to this Software.
No license is granted to use, reproduce, or distribute this Software 
without the express written consent of Sepio Corp.

For inquiries regarding licensing, please contact:
Sepio Corp
Email: legal@sepiocorp.com
*/
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'shikola',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root'
});

async function getPupilExamResults(pupilId, academicYear = null) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                er.id,
                er.exam_id,
                er.pupil_id,
                er.marks_obtained,
                er.percentage,
                er.grade,
                er.remarks,
                er.position,
                er.class_position,
                er.division,
                er.overall_grade,
                er.points,
                er.is_passed,
                er.is_absent,
                er.published_at,
                e.title as exam_title,
                e.exam_type,
                e.exam_date,
                e.total_marks,
                e.academic_year,
                sub.name as subject_name,
                p.admission_number,
                up.first_name || ' ' || up.last_name as pupil_name,
                c.name as class_name,
                s.name as school_name
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN pupils p ON er.pupil_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            JOIN classes c ON p.class_id = c.id
            JOIN schools s ON e.school_id = s.id
            WHERE er.pupil_id = $1
            AND er.status = 'published'
            AND e.result_publish_date <= NOW()
            ${academicYear ? 'AND e.academic_year = $2' : ''}
            ORDER BY e.exam_date DESC, sub.name
        `;
        
        const params = academicYear ? [pupilId, academicYear] : [pupilId];
        const result = await client.query(query, params);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getPupilExamResultsSummary(pupilId, academicYear = null) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT * FROM get_pupil_exam_results_summary($1, $2)
        `;
        const year = academicYear || new Date().getFullYear().toString();
        const result = await client.query(query, [pupilId, year]);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getPupilSubjectResults(pupilId, subjectId, academicYear = null) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                er.id,
                er.exam_id,
                er.marks_obtained,
                er.percentage,
                er.grade,
                er.division,
                er.points,
                er.is_passed,
                er.is_absent,
                er.remarks,
                er.published_at,
                e.title as exam_title,
                e.exam_type,
                e.exam_date,
                e.total_marks,
                e.academic_year,
                sub.name as subject_name,
                sub.code as subject_code,
                c.name as class_name
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN pupils p ON er.pupil_id = p.id
            JOIN classes c ON p.class_id = c.id
            WHERE er.pupil_id = $1
            AND e.subject_id = $2
            AND er.status = 'published'
            AND e.result_publish_date <= NOW()
            ${academicYear ? 'AND e.academic_year = $3' : ''}
            ORDER BY e.exam_date DESC
        `;
        
        const params = academicYear ? [pupilId, subjectId, academicYear] : [pupilId, subjectId];
        const result = await client.query(query, params);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getPupilClassRanking(pupilId, classId, academicYear = null) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                er.pupil_id,
                up.first_name || ' ' || up.last_name as pupil_name,
                p.admission_number,
                AVG(er.percentage) as average_percentage,
                AVG(er.points) as average_points,
                COUNT(DISTINCT er.exam_id) as exam_count,
                SUM(CASE WHEN er.is_passed = true THEN 1 ELSE 0 END) as passed_count,
                RANK() OVER (ORDER BY AVG(er.percentage) DESC) as class_rank,
                COUNT(*) OVER () as total_students
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN pupils p ON er.pupil_id = p.id
            JOIN users u ON p.user_id = u.id
            JOIN user_profiles up ON u.id = up.user_id
            JOIN classes c ON p.class_id = c.id
            WHERE c.id = $1
            AND er.status = 'published'
            AND e.result_publish_date <= NOW()
            ${academicYear ? 'AND e.academic_year = $2' : ''}
            GROUP BY er.pupil_id, up.first_name, up.last_name, p.admission_number
            ORDER BY average_percentage DESC
        `;
        
        const params = academicYear ? [classId, academicYear] : [classId];
        const result = await client.query(query, params);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getPupilOverallPerformance(pupilId, academicYear = null) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                COUNT(DISTINCT e.id) as total_exams,
                COUNT(DISTINCT e.subject_id) as total_subjects,
                SUM(er.marks_obtained) as total_marks,
                SUM(e.total_marks) as total_possible_marks,
                CASE 
                    WHEN SUM(e.total_marks) > 0 
                    THEN ROUND((SUM(er.marks_obtained)::DECIMAL / SUM(e.total_marks)::DECIMAL) * 100, 2)
                    ELSE 0 
                END as overall_percentage,
                AVG(er.points) as average_points,
                SUM(CASE WHEN er.is_passed = true THEN 1 ELSE 0 END) as passed_subjects,
                SUM(CASE WHEN er.is_absent = true THEN 1 ELSE 0 END) as absent_count,
                MAX(er.class_position) as best_position,
                MIN(er.class_position) as worst_position,
                AVG(er.class_position) as average_position,
                s.name as school_name,
                c.name as class_name,
                c.grade_level
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN pupils p ON er.pupil_id = p.id
            JOIN classes c ON p.class_id = c.id
            JOIN schools s ON e.school_id = s.id
            WHERE er.pupil_id = $1
            AND er.status = 'published'
            AND e.result_publish_date <= NOW()
            AND er.is_absent = false
            ${academicYear ? 'AND e.academic_year = $2' : ''}
        `;
        
        const params = academicYear ? [pupilId, academicYear] : [pupilId];
        const result = await client.query(query, params);
        return result.rows[0];
    } finally {
        client.release();
    }
}

async function getPupilRecentResults(pupilId, limit = 10) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                er.id,
                er.exam_id,
                er.marks_obtained,
                er.percentage,
                er.grade,
                er.division,
                er.points,
                er.is_passed,
                er.is_absent,
                er.published_at,
                e.title as exam_title,
                e.exam_type,
                e.exam_date,
                e.total_marks,
                sub.name as subject_name,
                c.name as class_name
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN subjects sub ON e.subject_id = sub.id
            JOIN pupils p ON er.pupil_id = p.id
            JOIN classes c ON p.class_id = c.id
            WHERE er.pupil_id = $1
            AND er.status = 'published'
            AND e.result_publish_date <= NOW()
            ORDER BY er.published_at DESC
            LIMIT $2
        `;
        
        const result = await client.query(query, [pupilId, limit]);
        return result.rows;
    } finally {
        client.release();
    }
}

async function getPupilResultNotifications(pupilId, unreadOnly = false) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT 
                ern.id,
                ern.exam_id,
                ern.pupil_id,
                ern.notification_type,
                ern.message,
                ern.is_read,
                ern.created_at,
                ern.read_at,
                e.title as exam_title,
                e.exam_type
            FROM exam_result_notifications ern
            JOIN exams e ON ern.exam_id = e.id
            WHERE ern.pupil_id = $1
            ${unreadOnly ? 'AND ern.is_read = false' : ''}
            ORDER BY ern.created_at DESC
        `;
        
        const result = await client.query(query, [pupilId]);
        return result.rows;
    } finally {
        client.release();
    }
}

async function markNotificationAsRead(notificationId, pupilId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const updateQuery = `
            UPDATE exam_result_notifications 
            SET is_read = true, read_at = NOW()
            WHERE id = $1 AND pupil_id = $2
            RETURNING id, is_read, read_at
        `;
        
        const result = await client.query(updateQuery, [notificationId, pupilId]);
        
        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

app.get('/api/pupil/:pupilId/results', async (req, res) => {
    try {
        const { pupilId } = req.params;
        const { academicYear } = req.query;
        
        const results = await getPupilExamResults(pupilId, academicYear);
        res.json(results);
    } catch (error) {
        console.error('Error fetching pupil exam results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pupil/:pupilId/results/summary', async (req, res) => {
    try {
        const { pupilId } = req.params;
        const { academicYear } = req.query;
        
        const summary = await getPupilExamResultsSummary(pupilId, academicYear);
        res.json(summary);
    } catch (error) {
        console.error('Error fetching pupil results summary:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pupil/:pupilId/subject/:subjectId/results', async (req, res) => {
    try {
        const { pupilId, subjectId } = req.params;
        const { academicYear } = req.query;
        
        const results = await getPupilSubjectResults(pupilId, subjectId, academicYear);
        res.json(results);
    } catch (error) {
        console.error('Error fetching pupil subject results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pupil/:pupilId/performance', async (req, res) => {
    try {
        const { pupilId } = req.params;
        const { academicYear } = req.query;
        
        const performance = await getPupilOverallPerformance(pupilId, academicYear);
        res.json(performance);
    } catch (error) {
        console.error('Error fetching pupil performance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pupil/:pupilId/results/recent', async (req, res) => {
    try {
        const { pupilId } = req.params;
        const { limit = 10 } = req.query;
        
        const results = await getPupilRecentResults(pupilId, parseInt(limit));
        res.json(results);
    } catch (error) {
        console.error('Error fetching recent results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pupil/:pupilId/class/:classId/ranking', async (req, res) => {
    try {
        const { pupilId, classId } = req.params;
        const { academicYear } = req.query;
        
        const ranking = await getPupilClassRanking(classId, academicYear);
        const pupilRank = ranking.find(r => r.pupil_id === pupilId);
        
        res.json({
            ranking: ranking,
            pupilRank: pupilRank || null
        });
    } catch (error) {
        console.error('Error fetching class ranking:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/pupil/:pupilId/notifications', async (req, res) => {
    try {
        const { pupilId } = req.params;
        const { unreadOnly } = req.query;
        
        const notifications = await getPupilResultNotifications(pupilId, unreadOnly === 'true');
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/pupil/:pupilId/notifications/:notificationId/read', async (req, res) => {
    try {
        const { pupilId, notificationId } = req.params;
        
        const result = await markNotificationAsRead(notificationId, pupilId);
        
        if (!result) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Pupil Exam Result API running on port ${PORT}`);
});

process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await pool.end();
    process.exit(0);
});
