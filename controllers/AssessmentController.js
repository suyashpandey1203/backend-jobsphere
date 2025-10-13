const { v4: uuidv4 } = require('uuid');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const AssessmentParticipant = require('../models/AssessmentParticipant');
const { Interviewer, Candidate } = require('../models/User');
const sendEmail = require('../utils/mailSender'); 
const { raw } = require('body-parser');
// --- 1. Create a New Assessment ---
// This is triggered when the user is on `/create_assessment` and clicks "Save and Continue".
exports.createAssessment = async (req, res) => {
    try {
        const { name, description } = req.body;
        // Create the new assessment document
        const newAssessment = new Assessment({
            name,
            description,
            room_id: `room-${uuidv4()}`,
            created_by: req.user._id,
        });
        await newAssessment.save();

        // Automatically add the creator as the first 'Accepted' participant
        // const participant = new AssessmentParticipant({
        //     assessment: newAssessment._id,
        //     user: req.user._id,
        //     role: 'interviewer',
        //     status: 'Accepted',
        // });
        // await participant.save();

        // Respond with the newly created assessment object. The frontend will use its _id to navigate.
        res.status(201).json(newAssessment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating assessment', error: error.message });
    }
};


// --- 4. Get Full Details for an Existing Assessment ---
// This is called when the frontend component loads on a `/assessment/:id` route.
exports.getAssessmentDetails = async (req, res) => {
    try {
        const { id: assessmentId } = req.params;
        console.log("id : ", req.params)
        
        // 1. Fetch the main assessment document and populate its `questions` array with the full question documents
        const assessment = await Assessment.findById(assessmentId).populate('questions');

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        // 2. Fetch all participants for this assessment and populate their user details
        const participants = await AssessmentParticipant.find({ assessment: assessmentId })
            .populate('user', 'name email'); // Select only the name and email fields from the user document

        // 3. Structure the final response to be easily used by the React component's state
        const response = {
            _id: assessment._id,
            name: assessment.name,
            description: assessment.description,
            roomId: assessment.room_id,
            questions: assessment.questions,
            // Separate participants into two arrays for easy rendering in the UI
            interviewers: participants.filter(p => p.role === 'interviewer').map(p => ({ name: p.user.name, status: p.status })),
            candidates: participants.filter(p => p.role === 'candidate').map(p => ({ name: p.user.name, status: p.status })),
        };
        
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assessment details', error: error.message });
    }
};



exports.getMyAssessments = async (req, res) => {
    // console.log("calll")
  try {
    const userId = req.user._id;
    // console.log(req.user);
    // Hosted Assessments (user created)
    const hosted = await Assessment.find({ created_by: userId })
      .select("_id name description createdAt updatedAt")
      .sort({ createdAt: -1 });

    // Collaborator Assessments (where user is interviewer)
    const collaboratorRecords = await AssessmentParticipant.find({
      user: userId,
      role: "interviewer",
    })
      .populate("assessment", "_id name description createdAt updatedAt")
      .sort({ createdAt: -1 });
     

    // console.log(collaboratorRecords)
    // Map collaborator assessments properly
    const collaborator = collaboratorRecords
      .filter((p) => p.assessment)
      .map((p) => ({
        _id: p.assessment._id,
        name: p.assessment.name,
        description: p.assessment.description,
        createdAt: p.assessment.createdAt,
        updatedAt: p.assessment.updatedAt,
      }));

    return res.status(200).json({
      hosted,
      collaborator,
    });
  } catch (err) {
    console.error("Error fetching assessments:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.inviteParticipant = async (req, res) => {
    try {
        const { id: assessmentId } = req.params;
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ message: 'Email and role are required.' });
        }

        let user;
        // Find or create the user based on their intended role
        if (role === 'interviewer') {
            user = await Interviewer.findOneAndUpdate(
                { email },
                { name: email.split('@')[0], email, password: 'defaultPassword123', role },
                { upsert: true, new: true }
            );
        } else { // role === 'candidate'
            user = await Candidate.findOneAndUpdate(
                { email },
                { name: email.split('@')[0], email, password: 'defaultPassword123', role },
                { upsert: true, new: true }
            );
        }

        const assessment = await Assessment.findById(assessmentId);
        console.log(assessment)

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found' });
        }

        const existingParticipant = await AssessmentParticipant.findOne({ assessment: assessmentId, user: user._id });
        if (existingParticipant) {
            return res.status(409).json({ message: 'This user has already been invited.' });
        }
        
        const newParticipant = new AssessmentParticipant({
            assessment: assessmentId,
            user: user._id,
            role,
        });
        await newParticipant.save();
        
        // --- NEW: Email Sending Logic ---
        const FRONTEND_URL = process.env.FRONTEND_URL;
        let inviteUrl;
        let emailSubject = `You're invited to an assessment on JobSphere`;
        let emailBody;

        // Construct a different URL and email body based on the user's role
        if (role === 'interviewer') {
            // Interviewers go to the assessment management page
            inviteUrl = `${FRONTEND_URL}/assessment/${assessmentId}`;
            const liveInterviewUrl = `${FRONTEND_URL}/videocall/${assessment.room_id}`;
          
            emailBody = `
                <h1>Invitation to Collaborate</h1>
                <p>You have been invited to be an interviewer for the assessment: <strong>${assessment.name}</strong>.</p>
                <p>Please click the link below to view the assessment details and add questions.</p>
                <a href="${inviteUrl}" style="padding: 10px 15px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Assessment</a>
                <p>Use this link to join the live video call at the scheduled time.</p>
                <a href="${liveInterviewUrl}" style="padding: 10px 15px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Join Live Call</a>
            `;
        } else { // role === 'candidate'
            // Candidates go directly to the live interview (in a real scenario, you might have a waiting room page)
            // For now, let's link them to a placeholder "start" page
            const liveInterviewUrl = `${FRONTEND_URL}/videocall/${assessment.room_id}`;
            emailBody = `
                <h1>Invitation to Interview</h1>
                <p>You have been invited to a technical assessment for the role of <strong>${assessment.name}</strong>.</p>
                <p>Please click the link below at your scheduled time to begin.</p>
                <a href="${liveInterviewUrl}" style="padding: 10px 15px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px;">Start Assessment</a>
            `;
        }

        // Call your mail sender utility
        await sendEmail(email, emailSubject, emailBody);

        res.status(200).json({ message: `Successfully invited ${email}` });
    } catch (error) {
        console.error('Invitation Error:', error);
        res.status(500).json({ message: 'Error inviting participant', error: error.message });
    }
};

