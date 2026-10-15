import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Chips, Empty, H2, JobCard, Screen } from '../../components/ui';
import { useDB } from '../../data/store';
import { JOB_FILTERS, ownerStats } from '../../data/owner';
import { jobCard } from '../../data/selectors';

const KEYS = Object.keys(JOB_FILTERS);

export default function Jobs() {
  const db = useDB();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState(params.filter && JOB_FILTERS[params.filter] ? params.filter : 'Needs Action');
  // Follow ?filter= when a dashboard tile changes it, without an effect.
  const [seenParam, setSeenParam] = useState(params.filter);
  if (params.filter !== seenParam) {
    setSeenParam(params.filter);
    if (params.filter && JOB_FILTERS[params.filter]) setFilter(params.filter);
  }

  const { count } = ownerStats(db);
  const jobs = db.jobs.filter(JOB_FILTERS[filter]).sort((x, y) => y.created.localeCompare(x.created));

  return (
    <Screen>
      <H2>Jobs</H2>
      <Chips options={KEYS} value={filter} onChange={setFilter} labels={k => k + ' ' + count(k)} />
      <View style={{ gap: 10 }}>
        {jobs.map(j => <JobCard key={j.id} showWho j={jobCard(db, j, 'a')} onPress={() => router.push(`/owner/job/${j.id}`)} />)}
      </View>
      {jobs.length === 0 ? <Empty s={14}>No jobs with this status.</Empty> : null}
    </Screen>
  );
}
