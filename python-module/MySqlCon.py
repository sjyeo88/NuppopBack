# -*- coding:utf-8 -*-
import pymysql

class MySQLCon:

    def __init__(self, host, user, passwd, charset):
        self.host = host
        self.user = user
        self.passwd = passwd
        self.charset = charset
        self.db=pymysql.connect(host=self.host, user=self.user, password=self.passwd, charset=self.charset)

    def getCursor(self):
        return self.db.cursor()

    #Get SQL Data by Tuple
    def getData(self, sql, formats):
        curs = self.getCursor()
        curs.execute(sql, formats)
        return curs.fetchall()

    #Get SQL Data by List
    def getDataByList(self, sql, formats):
        return list(self.getData(sql, formats))

    #Get Specific table's All Data by Tuple
    def getAllDataFromTable(self, dbNM, tableNM):
        sqlTableText = '%s.%s' % (dbNM, tableNM)
        sqlText = 'select * from ' + sqlTableText
        return self.getData(sqlText, ())

    #Get Specific table's Fields in Data by Tuple
    def getFieldDataFromTable(self, dbNM, tableNM, tgtList):
        sqlStr = 'select ' + ",".join(tgtList) + ' from ' + dbNM + '.' + tableNM + ";"
        return self.getData(sqlStr, ())

    #Get Specific table's All Data by Tuple
    def getAllDataFromTableByList(self, dbNM, tableNM):
        sqlStr = 'select * from ' + dbNM + '.' + tableNM + ";"
        return self.getDataByList(sqlStr, ())

    #Get Specific table's Fields in Data by List
    def getFieldDataFromTableByList(self, dbNM, tableNM, tgtList):
        sqlStr = 'select ' + ",".join(tgtList) + ' from ' + dbNM + '.' + tableNM + ";"
        return self.getDataByList(sqlStr, ())

    def searchFieldDataFromTableByList(self, dbNM, tableNM, tgtList, key, value):
        sqlStr = 'select ' + ",".join(tgtList) + ' from ' + dbNM + '.' + tableNM + ' where ' + key + '=%s;'
        #return self.getDataByList(sqlStr, (key, value))
        return self.getDataByList('select * from AB.prcd_bill where bill_no=%s;', (value))


    #Modifying Data by SQL
    def modifyData(self, sql, formats):
        curs = self.getCursor()
        curs.execute(sql, formats )
        curs.connection.commit()

    #Insert Data by SQL
    def insertDataByTable(self, dbNM, tableNM, data):
        listStr = []
        for i in range(0, len(data)):
            listStr.append(" %s")

        if type(data) == list:
            data = tuple(data)

        values = ','.join(listStr) #% data
        sqlStr = 'insert into ' + dbNM + '.' + tableNM + ' values(' + values + ')' + ';'
        self.modifyData(sqlStr, data)
        #print sqlStr
        #values = unicode(str(values))
        #values = str(values)
        #print listStr
        #print sqlStr

    def updateDataByRC(self, dbNM, tableNM, primKey, primKeyValue, field,  toData):
        toData = "'%s'" % toData
        sqlStr = 'update ' + dbNM + '.' + tableNM + ' set ' + field + '=%s' + ' where ' + primKey + '=%s;'
        self.modifyData(sqlStr, (toData, primKeyValue))
        #print sqlStr

    def delFieldDataFromTable(self, dbNM, tableNM, key, value):
        sqlStr = 'delete ' + ' from ' + dbNM + '.' + tableNM + ' where ' + key + '=%s;'
        return self.modifyData(sqlStr, value)
