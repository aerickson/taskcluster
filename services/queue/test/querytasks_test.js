const debug = require('debug')('test:query');
const assert = require('assert');
const slugid = require('slugid');
const _ = require('lodash');
const taskcluster = require('taskcluster-client');
const assume = require('assume');
const helper = require('./helper');
const testing = require('taskcluster-lib-testing');

helper.secrets.mockSuite(__filename, ['taskcluster', 'aws', 'azure'], function(mock, skipping) {
  helper.withAmazonIPRanges(mock, skipping);
  helper.withPulse(mock, skipping);
  helper.withS3(mock, skipping);
  helper.withQueueService(mock, skipping);
  helper.withBlobStore(mock, skipping);
  helper.withEntities(mock, skipping);
  helper.withServer(mock, skipping);

  test('pendingTasks >= 1', async () => {
    const taskDef = {
      provisionerId: 'no-provisioner-extended-extended',
      workerType: 'query-test-worker-extended-extended',
      schedulerId: 'my-scheduler',
      taskGroupId: 'dSlITZ4yQgmvxxAi4A8fHQ',
      routes: [],
      retries: 5,
      created: taskcluster.fromNowJSON(),
      deadline: taskcluster.fromNowJSON('2 minutes'),
      scopes: [],
      payload: {},
      metadata: {
        name: 'Unit testing task',
        description: 'Task created during unit tests',
        owner: 'jonsafj@mozilla.com',
        source: 'https://github.com/taskcluster/taskcluster-queue',
      },
      tags: {
        purpose: 'taskcluster-testing',
      },
    };

    const taskId1 = slugid.v4();
    const taskId2 = slugid.v4();

    debug('### Create tasks');
    await Promise.all([
      helper.queue.createTask(taskId1, taskDef),
      helper.queue.createTask(taskId2, taskDef),
    ]);

    const r1 = await helper.queue.pendingTasks(
      'no-provisioner-extended-extended',
      'query-test-worker-extended-extended',
    );
    assume(r1.pendingTasks).is.greaterThan(1);

    // Result is cached for 20 seconds, so adding one more and checking should
    // give the same result, as we're not waiting for the timeout
    await helper.queue.createTask(taskId1, taskDef);

    // Note: There is some timing here, but since the queue.pendingTasks result
    // is cached it ought to be really fast and take less than 20 seconds to
    // do: queue.createTask + queue.pendingTasks, if not that's also sort of a
    // bug we should investigate
    const r2 = await helper.queue.pendingTasks(
      'no-provisioner-extended-extended',
      'query-test-worker-extended-extended',
    );
    assume(r2.pendingTasks).is.equals(r1.pendingTasks);

    // WARNING: The test below this point is not fast and certainly not robust
    // enough to run all the time. But it can be easily activated if messing
    // with queueservice.js and you want to ensure that it still works.
    // Just comment out the return statement below.
    return; // STOP TEST HERE
    console.log('WARNING: Unstable test running, should be disabled on master');
    await testing.poll(async () => {
      // At some point in the future we have to got fetch a new result saying
      // more tasks are now in the queue...
      const r3 = await helper.queue.pendingTasks(
        'no-provisioner-extended-extended',
        'query-test-worker-extended-extended',
      );
      assume(r3.pendingTasks).is.greaterThan(r1.pendingTasks);
    }, 30, 1000);
  });

  test('pendingTasks == 0', async () => {
    const r1 = await helper.queue.pendingTasks(
      'no-provisioner-extended-extended',
      'empty-test-worker-extended-extended',
    );
    assume(r1.pendingTasks).equals(0);

    const r2 = await helper.queue.pendingTasks(
      'no-provisioner-extended-extended',
      'empty-test-worker-extended-extended',
    );
    assume(r2.pendingTasks).equals(0);
  });

  // aje
  //
  // process:
  //   - add task
  //   - check that initial value is empty as expected
  //   - claim task
  //   - verify that last_consumed value is expected
  test('last_consumed works', async () => {
    const taskDef = {
      provisionerId: 'no-provisioner-extended-extended',
      workerType: 'query-test-worker-extended-extended',
      schedulerId: 'my-scheduler',
      taskGroupId: 'dSlITZ4yQgmvxxAi4A8fHQ',
      routes: [],
      retries: 5,
      created: taskcluster.fromNowJSON(),
      deadline: taskcluster.fromNowJSON('2 minutes'),
      scopes: [],
      payload: {},
      metadata: {
        name: 'Unit testing task',
        description: 'Task created during unit tests',
        owner: 'jonsafj@mozilla.com',
        source: 'https://github.com/taskcluster/taskcluster-queue',
      },
      tags: {
        purpose: 'taskcluster-testing',
      },
    };

    const taskId1 = slugid.v4();
    const taskId2 = slugid.v4();

    debug('### Create tasks');
    await Promise.all([
      helper.queue.createTask(taskId1, taskDef),
      helper.queue.createTask(taskId2, taskDef),
    ]);

    const r1 = await helper.queue.lastConsumed(
      'no-provisioner-extended-extended',
      'query-test-worker-extended-extended',
    );
    assume(r1.lastConsumed).is.equal(0);

    // TODO: claim a job

    const r2 = await helper.queue.lastConsumed(
      'no-provisioner-extended-extended',
      'query-test-worker-extended-extended',
    );
    assume(r2.lastConsumed).is.not.equal(0);

    // // Result is cached for 20 seconds, so adding one more and checking should
    // // give the same result, as we're not waiting for the timeout
    // await helper.queue.createTask(taskId1, taskDef);

    // // Note: There is some timing here, but since the queue.pendingTasks result
    // // is cached it ought to be really fast and take less than 20 seconds to
    // // do: queue.createTask + queue.pendingTasks, if not that's also sort of a
    // // bug we should investigate
    // const r2 = await helper.queue.pendingTasks(
    //   'no-provisioner-extended-extended',
    //   'query-test-worker-extended-extended',
    // );
    // assume(r2.pendingTasks).is.equals(r1.pendingTasks);

    // // WARNING: The test below this point is not fast and certainly not robust
    // // enough to run all the time. But it can be easily activated if messing
    // // with queueservice.js and you want to ensure that it still works.
    // // Just comment out the return statement below.
    // return; // STOP TEST HERE
    // console.log('WARNING: Unstable test running, should be disabled on master');
    // await testing.poll(async () => {
    //   // At some point in the future we have to got fetch a new result saying
    //   // more tasks are now in the queue...
    //   const r3 = await helper.queue.pendingTasks(
    //     'no-provisioner-extended-extended',
    //     'query-test-worker-extended-extended',
    //   );
    //   assume(r3.pendingTasks).is.greaterThan(r1.pendingTasks);
    // }, 30, 1000);
  });
});
