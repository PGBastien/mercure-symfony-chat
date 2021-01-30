import React, { useCallback, useEffect, useRef, useState } from 'react';
import Msg from '../components/msg';
import MsgForm from '../components/msg_form';
import useFetchAll from '../hooks/useFetchAll';
import { conv_url, hub_url, msgs_url, msgTopic } from '../urls';
import Loader from '../utils/loader';
import moment from 'moment';
import { toast } from 'react-toastify';
import useFetch from '../hooks/useFetch';

const Conv = ({match, history}) => {
    const conv = match.params.id;
    if (!conv) {
        history.push('/');
        toast.warn('No Conversation found.');
    }

    const userId = parseInt(document.querySelector('div.data').dataset.user);
    const {loading: loadingMsgs, load: loadMsgs, data: msgs, setData: setMsgs} = useFetchAll(msgs_url(conv));
    const {loading, load, data: conver} = useFetch();

    const ref = useRef(null);

    const listenToMercure = useCallback(() => {
        const url = new URL(hub_url);
        url.searchParams.append('topic', msgTopic(conv));
        const eventSource = new EventSource(url, { withCredentials: true });
    
        /**
         * @param {MessageEvent} e 
         */
        eventSource.onmessage = e => {
            const data = JSON.parse(e.data);
            setMsgs(msgs => [...msgs, data]);
            if (ref.current) {
                ref.current.scrollTop = ref.current.scrollHeight; 
            }
        }
        return eventSource;
    }, [conv]);

    useEffect( async () => {
        await loadMsgs();
        await load(conv_url(conv), 'GET');
        const eventSource = listenToMercure(); 
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight; 
        } 
        return function cleanup() {
            eventSource.close();
        }
    }, [conv]);

    const goBack = useCallback(() => {
        if (history.length > 1) {
            history.goBack();
        }
    }, [conv])


    return(
        <div className="container mt-5">  
            {loading && <Loader width= {50} strokeWidth={10} minHeight={10}/>}                             
            {(!loading && conver.users) &&
                conver.users.map(e => {
                    if (e.id !== userId) {
                        return (<ConvHeader key={e.id} user={e} date={new Date(conver.updatedAt)} goBack={goBack} />);
                    }
                })
            }
            <div className="msgs" ref={ref}>
                { loadingMsgs && (<Loader />) }
                { !loadingMsgs && (msgs.map(m => (<Msg msg={m} key={m.id} userId={userId}/>))) }
                { !loadingMsgs && (<MsgForm id={conv} />) }
            </div>
        </div>
    );
}

const ConvHeader = ({user, date, goBack}) => {
    return(
        <div className="row d-flex justify-content-center align-items-center">
            <div className="col-4">
                <button className="btn btn-sm" onClick={goBack}><i className="fas fa-arrow-left"></i>back </button>
            </div>
            <div className="col-4 text-center">
                <img src={user.avatar} width="50" height="50" alt={user.name} className="text-left rounded-circle" style={{'position': 'relative'}} /> 
                <i className="fas fa-circle text-success" id="is-online"></i>
            </div>
            <div className="col-4 text-right">
                <span className="text-success"> {user.name} </span> <br />
                <small className="text-muted text-italic">
                    { moment(date).from() }
                </small>
            </div>
        </div>
    );
}

export default Conv;