# -*- coding:utf-8 -*-

import httplib2
import PrettyDict
import json
import GetAssemAPI
import MySqlCon
import datetime
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

#Get Bill Informaition from data.go.kr, The 20th Assemply
f = open('errorData.csv', 'w')
rawBill = GetAssemAPI.GetDataAPI('BillInfoService', 20)
db=MySqlCon.MySQLCon('localhost', 'root', '!dutkak3' , 'utf8')
http = httplib2.Http()
mpprint = PrettyDict.MPPrinter()
getRefBillURL = rawBill.makeUrl('getBillInfoList', 1, "")
response,content = http.request(getRefBillURL, 'GET')
tmp_dic = json.loads(content)
totalCount = int(tmp_dic['response']['body']['totalCount'])
print 'Number of Bills : ',
print totalCount
#mpprint.pprint(tmp_dic)
for pageNum in range(1, int(totalCount/10)+2):
#for pageNum in range(1, 10):
    getTmpBillURL= rawBill.makeUrl('getBillInfoList', pageNum, "")
    response,content = http.request(getTmpBillURL, 'GET')
    tmp_dic = json.loads(content)
    items = tmp_dic['response']['body']['items']['item']
    for itemNum in range(0, len(items)):
        item = items[itemNum]
        itemType = item['passGubn']
        if itemType == u'처리의안':
            row = [None, str(item['billNo']), item['billId'], \
                  #item['billName'].replace("'", "\\'").replace('"', '\\"'), \
                  item['billName'], \
                  item['proposerKind'], item['proposeDt'], \
                  item['procStageCd'], item['procDt'], item['generalResult']]

            try:
                db.delFieldDataFromTable('AB', 'prcd_bill', \
                                               'billNo', row[1])
            except Exception as e:
		print(e[1])
                errData='Delete_E,'+ ",".join(map(unicode, row)) + '\n'
                f.write(errData.encode('utf-8'))
            try:
                db.insertDataByTable('AB', 'prcd_bill', row)
            except Exception as e:
		print(e[1])
                errData=",".join(map(unicode, row)) + '\n'
                f.write(errData.encode('utf-8'))

        if itemType == u'계류의안':
            #print '계류의안', mpprint.pprint(item)
            row = [None, str(item['billNo']), item['billId'], \
                  #item['billName'].replace("'", "\\'").replace('"', '\\"'), \
                  item['billName'], \
                  item['proposerKind'], item['proposeDt'], item['procStageCd']]

            try:
                db.delFieldDataFromTable('AB', 'prcing_bill', \
                                               'billNo', row[1])
            except Exception as e:
		print(e[1])
                errData='Delete_E,'+ ",".join(map(unicode, row)) + '\n'
                f.write(errData.encode('utf-8'))
            try:
                db.insertDataByTable('AB', 'prcing_bill', row)
            except Exception as e:
		print(e[1])
                errData='Insert_E,'+ ",".join(map(unicode, row)) + '\n'
                f.write(errData.encode('utf-8'))
    now = datetime.datetime.now()
    print 100.0*round(float(pageNum)/(int(totalCount/10)+1), 5),
    print '%',
    print '('+now.strftime('%H:%M:%S')+ ')'
f.close()
