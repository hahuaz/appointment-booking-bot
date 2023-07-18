'use client';

import { useImmer } from 'use-immer';

export default function Home() {
  const API_ENDPOINT =
    'https://lb4412bo83.execute-api.us-west-2.amazonaws.com/prod';
  const [state, setState] = useImmer<{
    jwtToken: string;
    appointmentText: string;
    content: object | null;
    testCaseResults: Array<object>;
    errorMessage: string;
  }>({
    jwtToken: '',
    appointmentText: '',
    content: null,
    testCaseResults: [],
    errorMessage: '',
  });

  const handleSubmit = async () => {
    setState((draft) => {
      draft.errorMessage = '';
    });
    const response = await fetch(`${API_ENDPOINT}/interpret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.jwtToken}`,
      },
      body: JSON.stringify({
        appointmentText: state.appointmentText,
      }),
    });
    if (response.status === 200) {
      const data = await response.json();
      const { content, message } = data;
      if (message) {
        return setState((draft) => {
          draft.errorMessage = message;
        });
      }
      setState((draft) => {
        draft.content = content;
      });
    } else {
      setState((draft) => {
        draft.errorMessage = 'Something went wrong. Check console!';
      });
      console.error(response);
      const data = await response.json();
      console.log(data);
    }
  };

  const testCases = [
    'Merhaba. Bu cumartesi için randevu alabilir miyim?',
    'Selam! Yarın sabah saat 10:00 için bir randevu talep edebilir miyim?',
    'Hey! Gelecek hafta perşembe günü için bir randevu ayarlayabilir miyim?',
    '2024 yılı için 15 Temmuz tarihinde saat 14:30 için bir toplantı planlayabilir miyiz?',
    'Selamlar! Bir sonraki hafta sonu için randevu alabilir miyim?',
    'Hey! Yaklaşık iki hafta sonra bir toplantı yapabilir miyiz?',
    'Merhaba. Ayın sonuna doğru bir randevu ayarlamak istiyorum, mümkün mü?',
    'Selam! Eylül ayının başında bir toplantı organize edebilir miyiz?',
    'Hey! Önümüzdeki Salı günü için bir randevu alabilir miyim?',
    'Merhaba. Birkaç gün içinde sizinle görüşmek istiyorum, uygun bir zaman var mı?',
  ];

  const submitTestCases = async () => {
    setState((draft) => {
      draft.testCaseResults = [];
      draft.errorMessage = '';
    });

    await Promise.all(
      testCases.map(async (testCase, index) => {
        const response = await fetch(`${API_ENDPOINT}/interpret`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.jwtToken}`,
          },
          body: JSON.stringify({
            appointmentText: testCase,
          }),
        });

        if (response.status === 200) {
          const data = await response.json();
          const { content, message } = data;
          if (message) {
            return alert(message);
          }
          setState((draft) => {
            draft.testCaseResults[index] = content;
          });
        } else {
          setState((draft) => {
            draft.errorMessage = 'Something went wrong. Check console!';
          });
          console.error(response);
          const data = await response.json();
          console.log(data);
        }
      })
    );
  };

  return (
    <main className='p-24 max-w-screen-2xl'>
      {state.errorMessage && (
        <div className='bg-red-500 text-white px-4 py-2 rounded-md mb-4'>
          {state.errorMessage}
        </div>
      )}
      <div className='grid grid-cols-2  gap-5'>
        <div>
          <p className='mb-4'>Send your appointment request:</p>
          <div className='mb-4'>
            <label htmlFor='jwt-token' className='block mb-2 font-bold'>
              JWT Token:
            </label>
            <input
              type='password'
              name='jwtToken'
              id='jwt-token'
              value={state.jwtToken}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setState((draft) => {
                  draft.jwtToken = e.target.value;
                });
              }}
            />
          </div>
          <div className='mb-4'>
            <label htmlFor='appointment-text' className='block mb-2 font-bold'>
              Appointment Text:
            </label>
            <textarea
              name='appointmentText'
              id='appointment-text'
              value={state.appointmentText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setState((draft) => {
                  draft.appointmentText = e.target.value;
                });
              }}
              className='w-full h-40 px-4 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring focus:ring-blue-500'
            />
          </div>
          <button
            onClick={handleSubmit}
            className='px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600'
            disabled={!state.jwtToken || !state.appointmentText}
          >
            Submit
          </button>
        </div>
        {state.content && (
          <div>
            <p className='text-xl mb-4'>Your appointment:</p>
            {JSON.stringify(state.content, null, 2)}
          </div>
        )}
      </div>
      <div className='mt-24 grid grid-cols-2'>
        <div>
          <ul className='list-decimal'>
            {testCases.map((testCase, index) => {
              return <li key={index}> {testCase} </li>;
            })}
          </ul>
          <button
            onClick={submitTestCases}
            className='px-4 py-2 mt-4 text-white bg-red-500 rounded-md hover:bg-red-600'
            disabled={!state.jwtToken}
          >
            Submit all test cases:
          </button>
        </div>
        {state.testCaseResults.length > 0 && (
          <ul className='list-decimal'>
            {state.testCaseResults.map((testCase, index) => {
              return <li key={index}>{JSON.stringify(testCase, null, 2)}</li>;
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
