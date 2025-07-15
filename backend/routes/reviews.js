const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Client = require('../models/Client');
const Freelancer = require('../models/Freelancer');

router.post('/clients/:clientId', async (req, res) => {
  const { clientId } = req.params;
  const { taskId, rating, comment, reviewerId } = req.body;

  try {
    if (!taskId || !rating || !reviewerId) {
      return res.status(400).json({ message: 'Task ID, rating, and reviewer ID are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const client = await Client.findOne({ account: clientId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const existingReview = await Review.findOne({ taskId, reviewerId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this task' });
    }

    const review = new Review({
      taskId,
      clientId,
      reviewerId,
      rating,
      comment: comment || '',
    });
    await review.save();

    // Update client's rating
    const reviews = await Review.find({ clientId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    await Client.updateOne(
      { account: clientId },
      { $set: { rating: averageRating } }
    );

    // Fetch the updated client to confirm
    const updatedClient = await Client.findOne({ account: clientId });
    console.log('Updated client rating:', updatedClient.rating);

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error while submitting review' });
  }
});

router.post('/freelancers/:freelancerId', async (req, res) => {
  const { freelancerId } = req.params;
  const { taskId, rating, comment, reviewerId } = req.body;

  try {
    if (!taskId || !rating || !reviewerId) {
      return res.status(400).json({ message: 'Task ID, rating, and reviewer ID are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const freelancer = await Freelancer.findOne({ account: freelancerId });
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }

    const existingReview = await Review.findOne({ taskId, reviewerId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this task' });
    }

    const review = new Review({
      taskId,
      freelancerId,
      reviewerId,
      rating,
      comment: comment || '',
    });
    await review.save();

    // Update freelancer's rating and reviews
    const reviews = await Review.find({ freelancerId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    await Freelancer.updateOne(
      { account: freelancerId },
      {
        $set: { rating: averageRating },
        $push: { reviews: { client: reviewerId, rating, comment } }
      }
    );

    // Fetch the updated freelancer to confirm
    const updatedFreelancer = await Freelancer.findOne({ account: freelancerId });
    console.log('Updated freelancer rating:', updatedFreelancer.rating);

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Server error while submitting review' });
  }
});

module.exports = router;