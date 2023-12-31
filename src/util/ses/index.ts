const changePasswordHtml = (token: string, nickname: string) => {
  const url =
    process.env.NODE_ENV == 'production'
      ? `https://api.antville.kr/auth/find-password?token=${token}`
      : `http://54.180.188.129:3000/auth/find-password?token=${token}`;
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <div
      style="
        max-width: 600px;
        box-sizing: border-box;
      "
    >
    <div style="
    width: 100%;
    display: block;
    box-sizing: border-box;
    padding-left: 32px;
    padding-right: 32px;
    padding-top: 38px;
  ">
    <img
    style="width: 150px; height: 27.71px"
    src="https://antville-test.s3.ap-northeast-2.amazonaws.com/web/web_logo.png"
  />
  <div
        style="
          width: 100%;
          height: 1.5px;
          border-style: solid;
          border-width: 0.5px;
          border-style: solid;
          border-color: rgba(244, 244, 244, 1);
          margin-top: 10.29px;;
        "
      >
    </div>
    </div>

      <div style="
      box-sizing: border-box;
          margin: 0px auto;
          width: 100%;
          padding: 40px 45px 24px 45px;
          display: block;
      ">
         <p
         style="
           font-size: 18px;
           font-weight: 700;
           line-height: 100%;
           text-align: center;
           color: rgba(31.88, 31.88, 31.88, 1);
           margin-bottom: 44px;
         "
       >
         비밀번호를 잊으셨나요?
       </p>
       <div  style="
       font-size: 14px;
            text-align: center;
            font-weight: 500;
            line-height: 19.07px;
            color: rgba(31.88, 31.88, 31.88, 1);
     ">
     <span style="font-weight: 700;">
        ${nickname}
     </span>
       <span
     >
      회원님, 앤트빌을 이용해주셔서 감사합니다.<br/>아래 버튼을 눌러 임시 비밀번호를 발급받으세요.
    </span>
     </div>
     
    
     
       
       <a href="${url}" target="_blank" style="
        text-decoration:none;
       ">
       <div
            style="
              background-color: rgba(76, 158, 235, 1);
              border-radius: 5px;
              margin: 53px auto 0px auto;
              box-sizing: border-box;
              padding: 13px 30px;
              width: 50%;
            "
          >
         <p
           style="
             font-size: 13px;
             font-weight: 700;
             margin: 0px;
             text-align: center;
             color: rgba(249.69, 249.69, 249.69, 1);
           "
         >
           임시 비밀번호 발급받기
         </p>
         </div>
        </a>
       
      
       <div style="width: 90%; padding-top: 13px; padding-bottom: 13px;  padding-left: 10px; padding-right: 10px; margin-top: 44px;
        background-color: rgba(249.69, 249.69, 249.69, 1); border-radius: 5px; display: block;">
            <p style="font-size: 12px; 
            padding: 0px;
            margin: 0px;
            font-weight: 500; line-height: 20px; color: rgba(65.87, 65.87, 65.87, 1);">• 계정 보안을 위해 로그인 후, 반드시 비밀번호를 변경해주세요.<br/>• 해당 링크는 24시간 후에 만료됩니다.<br/>• 본 메일은 발신 전용으로 회신 되지 않습니다.<br/>• 기타 문의사항은 고객센터로 연락 바랍니다.</p>
        </div>
   
      </div>
      <div style="width: 100%;
      display: block;
      box-sizing: border-box;
      padding-left: 32px;
      padding-right: 32px;
      ">
        <div
        style="
          width: 100%;
          height: 1.5px;
          border-style: solid;
          border-width: 0.5px;
          border-style: solid;
          border-color: rgba(244, 244, 244, 1);
          margin-bottom: 10;
        "
      ></div>
        <p
        style="
        font-size: 10px;
        text-align: center;
        line-height: 20px;
        color: rgba(158, 158, 158, 1);
        "
      >
        Copyright© Antville. All rights reserved.
      </p>
       </div>

      </div>
    
  </body>
</html>`;
};

export const changePasswordEmailRequest = (
  token: string,
  nickname: string,
  email: string,
) => {
  const html = changePasswordHtml(token, nickname);
  return {
    Destination: {
      ToAddresses: [email],
    },
    Content: {
      Simple: {
        Subject: {
          Charset: 'UTF-8',
          Data: '[Antville] 임시비밀번호 발급',
        },

        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
        },
      },
    },
    FromEmailAddress: 'info@antville.kr',
    ReplyToAddresses: ['info@antville.kr'],
  };
};

const verifyEmailHtml = (token: string, nickname: string) => {
  const url =
    process.env.NODE_ENV == 'production'
      ? `https://api.antville.kr/auth/verify?token=${token}`
      : `http://54.180.188.129:3000/auth/verify?token=${token}`;
  return `<!DOCTYPE html>
  <html lang="ko">
    <head>
      <meta charset="UTF-8" />
    </head>
    <body>
      <div
        style="
          max-width: 600px;
          box-sizing: border-box;
        "
      >
      <div style="
      width: 100%;
          display: block;
          box-sizing: border-box;
          padding-left: 32px;
          padding-right: 32px;
          padding-top: 38px;
    ">
      <img
      style="width: 150px; height: 27.71px"
      src="https://antville-test.s3.ap-northeast-2.amazonaws.com/web/web_logo.png"
    />
    <div
          style="
            width: 100%;
            height: 1.5px;
            border-style: solid;
            border-width: 0.5px;
            border-style: solid;
            border-color: rgba(244, 244, 244, 1);
            margin-top: 10.29px;;
          "
        >
      </div>
      </div>
  
        <div style="
        box-sizing: border-box;
      margin: 0px auto;
        width: 100%;
        padding: 40px 45px 24px 45px;
        display: block;
        ">
           <p
           style="
             font-size: 18px;
             font-weight: 700;
             line-height: 100%;
             text-align: center;
             color: rgba(31.88, 31.88, 31.88, 1);
             margin-bottom: 44px;
           "
         >
           이메일 주소 인증하기
         </p>
         <div  style="
         font-size: 14px;
         text-align: center;
         font-weight: 500;
         line-height: 19.07px;
         color: rgba(31.88, 31.88, 31.88, 1);
         margin-bottom: 53px;
       ">
       <span style="font-weight: 700;">
          ${nickname}
       </span>
         <span
       >
        회원님, 앤트빌을 이용해주셔서 감사합니다.<br/>아래 버튼을 눌러 이메일 인증을 진행해주세요.
      </span>
       </div>
       
      
       
         
         <a href="${url}" target="_blank" style="
          text-decoration:none;
         ">
         <div
       style="
         background-color: rgba(76, 158, 235, 1);
         border-radius: 5px;
         padding: 13px 30px;
         margin: 0px auto 0px auto;
         box-sizing: border-box;
         width: 60%;
       "
     >
           <p
             style="
               font-size: 13px;
               font-weight: 700;
               margin: 0px;
               text-align: center;
               color: rgba(249.69, 249.69, 249.69, 1);
             "
           >
             이메일 주소 인증하기
           </p>
           </div>
          </a>
         
        
         <div style="width: 90%; padding-top: 13px; padding-bottom: 13px;  padding-left: 10px; padding-right: 10px; margin-top: 44px;
          background-color: rgba(249.69, 249.69, 249.69, 1); border-radius: 5px; display: block;">
              <p style="font-size: 12px; 
              padding: 0px;
              margin: 0px;
              font-weight: 500; line-height: 20px; color: rgba(65.87, 65.87, 65.87, 1);">• 이메일 인증 완료 후 정상적인 서비스 이용이 가능합니다.<br/>• 해당 링크는 24시간 후에 만료됩니다.<br/>• 본 메일은 발신 전용으로 회신 되지 않습니다.<br/>• 기타 문의사항은 고객센터로 연락 바랍니다.</p>
          </div>
     
        </div>
  
        
         
          
      
  
      <div style="width: 100%;
      width: 100%;
      display: block;
      box-sizing: border-box;
      padding-left: 32px;
      padding-right: 32px;
        ">
          <div
          style="
            width: 100%;
            height: 1.5px;
            border-style: solid;
            border-width: 0.5px;
            border-style: solid;
            border-color: rgba(244, 244, 244, 1);
            margin-bottom: 10;
          "
        ></div>
          <p
          style="
            font-size: 10px;
            line-height: 20px;
            text-align: center;
            color: rgba(158, 158, 158, 1);
          "
        >
          Copyright© Antville. All rights reserved.
        </p>
         </div>
  
        </div>
      
    </body>
  </html>
  `;
};

export const verifyEmailRequest = (
  token: string,
  nickname: string,
  email: string,
) => {
  const html = verifyEmailHtml(token, nickname);
  return {
    Destination: {
      ToAddresses: [email],
    },
    Content: {
      Simple: {
        Subject: {
          Charset: 'UTF-8',
          Data: '[Antville] 이메일 인증',
        },

        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
        },
      },
    },
    FromEmailAddress: 'info@antville.kr',
    ReplyToAddresses: ['info@antville.kr'],
  };
};
