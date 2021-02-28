/* eslint-disable */

// add bites/users to reviews
db.reviews.find().forEach(async function (review) {
  const bite = await db.bites.aggregate([{ $sample: { size: 1 } }]).toArray();
  // print(bite);
  await db.reviews.updateOne(
    { _id: review._id },
    { $set: { bite: bite[0]._id } }
  );
});

// update user passwords
