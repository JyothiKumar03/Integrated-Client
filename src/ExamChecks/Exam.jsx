import React, { useState, useEffect, useRef , useContext, useCallback } from 'react';
// import Timer from "../src/timer/Timer.jsx";
// import WebLiveCapture from '../src/weblivecapture/WebLiveCapture.jsx';
import '../css/Exam.css';
import { useLocation , useParams} from 'react-router-dom';
import Swal from 'sweetalert2'; // Import SweetAlert as Swal
import { StudentContext } from "../contextCalls/studentContext/StudentContext"; // Import StudentContext
import TimerComponent from '../ExamChecks/TimerComp.jsx';
import { useDispatch, useSelector } from "react-redux";
import LeftColumn from '../ExamChecks/LeftCol.jsx';
import EmbeddedForm from '../ExamChecks/FormComp.jsx';
import {
  } from "../store/slices/ansForm";
// import Sound from './Sound.wav'
import { setTimeExpired, getTimeExpired,incrementMalPracticeAttempts, getMalPracticeAttempts } from '../store/slices/examTimer.jsx';
import Warning from '../ExamChecks/Warning.wav'
import Watermark from '../ExamChecks/Watermark.jsx';
import { AlternateEmail } from '@mui/icons-material';
import { toast ,ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Exam = () => {
    const { user } = useContext(StudentContext);

    const location = useLocation(); // Use useLocation hook to get location object
    const params = new URLSearchParams(location.search);
    const examTitle = params.get("title");
    const duration = parseInt(params.get("duration")); // Parse duration as integer
    const formLink = params.get("url");
    console.log('exam params -> ', examTitle, duration)
    const studentName = user.user.user.name; // Assuming this is a static value
    const studentEmail = user.user.user.email;
    const dispatch = useDispatch();
    const malpracticeAttempts = useSelector(getMalPracticeAttempts);
//     const formId = params.get("url").split("/").pop(); // Extract formId from the URL
//   console.log(formId);
    const isTimeExpired = useSelector(getTimeExpired);

    const fullscreenRef = useRef(null);
    const countdownRef = useRef(null);

    const [warningCnt, setWarningCnt] = useState(0);
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullscreenAlertShown, setFullscreenAlertShown] = useState(false); // State to track if fullscreen alert has been shown

    const handleFullscreen = useCallback(() => {
        if (fullscreenRef.current) {
            const element = document.documentElement;

            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        }
    }, []);

    const terminateExam = useCallback(() => {
        //temp
        if (warningCnt >= 12) {
            disableForm();
            Swal.fire({
                icon: 'error',
                title: 'Exam Terminated',
                text: 'Your exam has been terminated due to multiple warnings.',
                showCancelButton: false,
                confirmButtonText: 'Go back to dashboard',
                customClass: {
                    popup: 'my-popup-class',
                },
            }).then(() => {
                // Redirect or navigate to the dashboard
                // Example redirect:
                window.close() // Adjust the URL as needed
            });
        }
    }, [warningCnt]);

    useEffect(() => {
        let tabSwitchTimer;
        let fullScreenTimer;
    
        const startTabSwitchTimer = () => {
            tabSwitchTimer = setTimeout(() => {
                setWarningCnt((warningCnt) => warningCnt + 1);
                
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning',
                    text: `You switched tabs. Please return to the exam. Warning count: ${warningCnt}`,
                    showCancelButton: true,
                    confirmButtonText: 'Return to Fullscreen',
                    cancelButtonText: 'Cancel',
                    customClass: {
                        popup: 'my-popup-class',
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(incrementMalPracticeAttempts());
                        // alert(`MalPract after update - ${malpracticeAttempts}`)
                        handleFullscreen();
                    }
                });
                terminateExam(); // Ensure that terminateExam is called
            }, 5000); // 5 seconds
        };
    
        const startFullScreenTimer = () => {
            fullScreenTimer = setTimeout(() => {
                setWarningCnt((warningCnt) => warningCnt + 1);
                
                Swal.fire({
                    title: 'Go back to Fullscreen',
                    text: `You are not in fullscreen mode. Go back to Full Screen mode. Warning count: ${warningCnt}`,
                    icon: 'info',
                    showCancelButton: false,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    customClass: {
                        popup: 'my-popup-class',
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(incrementMalPracticeAttempts());
                        // alert(`MalPract after update - ${malpracticeAttempts}`)
                        handleFullscreen();
                    }
                });
                terminateExam(); // Ensure that terminateExam is called
            }, 10000); // 10 seconds
        };
    
        const visibilityChangeHandler = () => {
            if (document.hidden) {
                startTabSwitchTimer();
            } else {
                clearTimeout(tabSwitchTimer);
            }
            terminateExam(); // Ensure that terminateExam is called
        };
    
        const fullscreenChangeHandler = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
                startFullScreenTimer();
            } else {
                clearTimeout(fullScreenTimer);
            }
            terminateExam(); // Ensure that terminateExam is called
        };
    
        document.addEventListener('visibilitychange', visibilityChangeHandler);
        document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
    
        return () => {
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
            document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler);
            clearTimeout(tabSwitchTimer);
            clearTimeout(fullScreenTimer);
        };
    }, [handleFullscreen, warningCnt, terminateExam]);
    

    useEffect(() => {
        const fullscreenChangeHandler = () => {
            const sound = new Audio(Warning);
            setIsFullScreen(!!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement));
            if (!document.fullscreenElement && isFullScreen) {
                setWarningCnt((warningCnt) => warningCnt + 1);
                
                sound.play()
                Swal.fire({
                    title: 'Go back to Fullscreen',
                    text: `You are not in fullscreen mode.  go back to Full Screen mode Warning count: ${warningCnt}`,
                    icon: 'info',
                    showCancelButton: false,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    customClass: {
                        popup: 'my-popup-class',
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(incrementMalPracticeAttempts());
                        // alert(`MalPract after update - ${malpracticeAttempts}`)
                        handleFullscreen();
                    }
                });
            }
            terminateExam()
        };
    
        document.addEventListener('fullscreenchange', fullscreenChangeHandler);
        document.addEventListener('webkitfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('mozfullscreenchange', fullscreenChangeHandler);
        document.addEventListener('MSFullscreenChange', fullscreenChangeHandler);
    
        return () => {
            document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('webkitfullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('mozfullscreenchange', fullscreenChangeHandler);
            document.removeEventListener('MSFullscreenChange', fullscreenChangeHandler);
        };
    }, [isFullScreen, handleFullscreen, warningCnt,terminateExam]);

    useEffect(() => {
        if (!isFullScreen && !fullscreenAlertShown) {
            Swal.fire({
                title: 'Enter Fullscreen',
                text: `You have to enter fullscreen mode`,
                icon: 'info',
                showCancelButton: false,
                confirmButtonText: 'Make FullScreen',
                
                customClass: {
                    popup: 'my-popup-class',
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    handleFullscreen();
                    setFullscreenAlertShown(true);
                }
            });
        }
    }, [isFullScreen, fullscreenAlertShown, handleFullscreen]);

    // async function handleSubmit() {
    //     let canSubmit = true;
    //     // for (let i = 0; i < answers.length; i++) {
    //     //   if (questions[i].required === true && answers[i] === undefined) {
    //     //     dispatch(setTriedSubmitting(true));
    //     //     setErrorMsg("Answer all the required questions before submitting");
    //     //     canSubmit = false;
    //     //   }
    //     // }
      
    //     if (canSubmit) {
    //       console.log("submitting form");
    //       const res = await submitForm(answers, formId);
    //       console.log(res);
    //       dispatch(setSubmit(true))
    //       if (res.status === 201) {
    //         dispatch(setTriedSubmitting(false));
    //         console.log("submitted");
    //         if (isSubmitted) {
    //           // Close the parent window
    //           console.log(`form is submitted`)
    //         //   window.parent.close();
    //         }
    //       }
    //       if (res.status === 302) {
    //         dispatch(setTriedSubmitting(true));
    //         setErrorMsg(res.data.message);
    //       }
    //     }
    //   }

    useEffect(() => {
        countdownRef.current = setTimeout(async () => {
            // dispatch(setTimeExpired(true));
            // Auto-submit the form when the timer expires
            // dispatch(setTimeExpired(true))
            dispatch(setTimeExpired(true))
            console.log(`after useEffect - ${isTimeExpired}`)
            // if (isTimeExpired && !isSubmitted) {
                
            //      handleSubmit();
            //     console.log(`form by timer, ${isTimeExpired}, ${isSubmitted}`);
            //     // window.close(); // Optionally close the window after submission
            // } else if (isTimeExpired && isSubmitted) {
            //     console.log("timer expired, not submitted")
            //     // window.close(); // Optionally close the window if the form is already submitted
            // } else if(!isTimeExpired && isSubmitted){
            //     window.close(); // Optionally close the window if the form is already submitted
            // }
        }, duration * 60 * 1000); // Convert duration to milliseconds
        console.log('the countdownRef - ',countdownRef)
        // Cleanup function to clear the timeout when the component unmounts
        return () => clearTimeout(countdownRef.current);
    }, [duration, isTimeExpired, dispatch]);
        

  

    // useEffect(() => {
    //     // Start the countdown timer when the component mounts
    //     countdownRef.current = setTimeout(() => {
    //         setTimerExpired(true);
    //         // Close the window when the timer expires
    //         if(timerExpired){
    //             window.close(); 
    //         } else if(isSubmitted){
    //             window.close();
    //         }
    //     }, duration * 60 * 1000); // Convert duration to milliseconds

    //     // Cleanup function to clear the timeout when the component unmounts
    //     return () => clearTimeout(countdownRef.current);
    // }, [duration]);

    useEffect(() => {
        const devToolsChangeHandler = (event) => {
            const sound = new Audio(Warning);
            if (event.detail.isOpen) {
                setWarningCnt((warningCnt) => warningCnt + 1);
                
                sound.play()
                setIsDevToolsOpen(true);
            }

            if (!isDevToolsOpen) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning',
                    text: `Your exam will terminate. Please close devtools.Warning count: ${warningCnt}`,
                    customClass: {
                        popup: 'my-popup-class',
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(incrementMalPracticeAttempts());
                        // alert(`MalPract after update - ${malpracticeAttempts}`)
                       
                    }
                });
                disableForm();
            } else {
                enableForm();
            }

            terminateExam();
        };

        window.addEventListener('devtoolschange', devToolsChangeHandler);

        return () => {
            window.removeEventListener('devtoolschange', devToolsChangeHandler);
        };
    }, [isDevToolsOpen,warningCnt,terminateExam, malpracticeAttempts]);

    


    useEffect(() => {
        const keyDownHandler = (event) => {
            const sound = new Audio(Warning);
            if ((event.ctrlKey && event.shiftKey && event.key === 'I') || (event.key === 'F12')) {
                event.preventDefault();
                setWarningCnt((warningCnt) => warningCnt + 1);
                
                sound.play();
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning',
                    text: `Opening developer tools is not allowed during the exam.Warning count: ${warningCnt}`,
                    customClass: {
                        popup: 'my-popup-class',
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(incrementMalPracticeAttempts());
                        // alert(`MalPract after update - ${malpracticeAttempts}`)
                        
                    }
                });
                disableForm();
                terminateExam();
            }
        };

        document.addEventListener('keydown', keyDownHandler);

        return () => {
            document.removeEventListener('keydown', keyDownHandler);
        };
    }, [warningCnt,malpracticeAttempts]);

    
    

    useEffect(() => {
        const sound = new Audio(Warning);
        const copyHandler = (event) => {
            event.preventDefault();
            setWarningCnt((warningCnt) => warningCnt + 1);
            
            sound.play(); // Play the sound effect
            Swal.fire({
                icon: 'warning',
                title: 'Warning',
                text: `Copying content is not allowed during the exam.Warning count: ${warningCnt}`,
                customClass: {
                    popup: 'my-popup-class',
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    dispatch(incrementMalPracticeAttempts());
                    // alert(`MalPract after update - ${malpracticeAttempts}`)
                    
                }
            });
            disableForm();
            terminateExam(); // Ensure that terminateExam is called
        };
    
        document.addEventListener('copy', copyHandler);
    
        return () => {
            document.removeEventListener('copy', copyHandler);
        };
    }, [warningCnt,terminateExam,malpracticeAttempts]);

    useEffect(() => {
        const contextMenuHandler = (event) => {
            event.preventDefault();
        };

        document.addEventListener('contextmenu', contextMenuHandler);

        return () => {
            document.removeEventListener('contextmenu', contextMenuHandler);
        };
    }, []);

    useEffect(() => {
        const visibilityChangeHandler = () => {
            const sound = new Audio(Warning);
            if (document.hidden) {
                setWarningCnt((warningCnt) => warningCnt + 1);
                sound.play();
                Swal.fire({
                    icon: 'warning',
                    title: 'Warning',
                    text: `You switched tabs. Please return to the exam.Warning count: ${warningCnt}`,
                    showCancelButton: true,
                    confirmButtonText: 'Return to Fullscreen',
                    cancelButtonText: 'Cancel',
                    customClass: {
                        popup: 'my-popup-class',
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        dispatch(incrementMalPracticeAttempts());
                        // alert(`MalPract after update - ${malpracticeAttempts}`)
                        handleFullscreen();
                    }
                });
            }
            terminateExam(); // Ensure that terminateExam is called
        };

        document.addEventListener('visibilitychange', visibilityChangeHandler);

        return () => {
            document.removeEventListener('visibilitychange', visibilityChangeHandler);
        };
    }, [warningCnt,terminateExam,malpracticeAttempts]);
    function disableForm() {
        // Implement disable form logic here
    }

    function enableForm() {
        // Implement enable form logic here
    }
    


    

    // TO EMBED
    let embeddedFormLink = formLink + '?embedded=true';

    return (
        <div className="exam-wrapper">
             <Watermark studentName={studentName} studentEmail={studentEmail}/>
            {/* <button className='fullscreen-button' onClick={handleFullscreen}>Make Fullscreen</button> */}
            <div ref={fullscreenRef}></div>
            <div className="exam-container">
                <LeftColumn studentName={studentName} studentEmail={studentEmail} />
                <EmbeddedForm embeddedFormLink={embeddedFormLink} examTitle={examTitle} malpracticeAttempts={malpracticeAttempts}/>
                <TimerComponent duration={duration} />
            </div>
        </div>
        
    );
};

export default Exam;

